import OpenAI from 'openai';
import logger from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined
});

const generateEmbedding = async (text) => {
  try {
    if (process.env.GROQ_API_KEY) {
      logger.info('Groq does not support embeddings, using keyword search fallback');
      return null;
    }
    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-3-small'
    });
    return response.data[0].embedding;
  } catch (error) {
    logger.error('Embedding generation error:', error.message);
    throw error;
  }
};

const chatCompletion = async (messages, temperature = 0.7) => {
  try {
    const isGroq = !!process.env.GROQ_API_KEY;
    const response = await openai.chat.completions.create({
      messages,
      temperature,
      max_tokens: 2000,
      model: isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o'
    });
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Chat completion error:', error.message);
    throw error;
  }
};

export const generateEventDescription = async (eventData) => {
  const { title, category, date, location, time, ticketPrice, capacity } = eventData;
  
  const priceText = ticketPrice > 0 ? `$${ticketPrice}` : 'Free';
  const timeText = time || '10:00 AM - 5:00 PM';
  const capacityText = capacity || 100;

  const systemPrompt = `You are a professional event descriptions writer. Generate compelling, engaging event descriptions that are 150-200 words. Use exciting language that attracts attendees. Include what to expect, why they should attend, and key highlights.`;

  const userPrompt = `Generate a compelling event description for:

Event: ${title}
Category: ${category}
Date: ${new Date(date).toLocaleDateString()}
Location: ${location}
Time: ${timeText}
Price: ${priceText}
Capacity: ${capacityText} attendees

Write in second person ("You", "Your") to engage the reader directly. Make it exciting and informative.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return chatCompletion(messages, 0.8);
};

export const getEventRecommendations = async (userPreferences, events, limit = 5) => {
  if (!events || events.length === 0) {
    return [];
  }

  const prefString = `
    - Preferred categories: ${userPreferences.categories?.join(', ') || 'Any'}
    - Interested in: ${userPreferences.interests?.join(', ') || 'General events'}
    - Location preference: ${userPreferences.location || 'Any'}
    - Budget: ${userPreferences.budget || 'Any'}
  `;

  const eventsList = events.map((e, i) => 
    `${i + 1}. ${e.title} | ${e.category} | ${e.date.toString().slice(0,10)} | ${e.location} | ${e.ticketPrice === 0 ? 'Free' : '$' + e.ticketPrice}`
  ).join('\n');

  const systemPrompt = `You are an event recommendation expert. Analyze user preferences and recommend the most relevant events from a list. Return a JSON array of event indices (1-based) that best match the user's preferences, ordered by relevance.`;

  const userPrompt = `User preferences:
${prefString}

Available events:
${eventsList}

Based on the user's preferences, which events would you recommend? Consider:
1. Category match
2. Location proximity  
3. Budget fit
4. Date availability
5. Interest alignment

Return ONLY a JSON array of indices (e.g., [1,3,5]) ordered by best match. No other text.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const result = await chatCompletion(messages, 0.3);
    const indices = JSON.parse(result.replace(/[^[\d,]]/g, ''));
    
    if (!Array.isArray(indices)) return events.slice(0, limit);
    
    return indices
      .filter(i => i > 0 && i <= events.length)
      .slice(0, limit)
      .map(i => events[i - 1]);
  } catch (error) {
    logger.error('Recommendation error:', error.message);
    return events.slice(0, limit);
  }
};

export const semanticSearch = async (query, events, limit = 12) => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    
    if (!events || events.length === 0) {
      return { events: [], query };
    }

    const eventsWithScores = await Promise.all(
      events.map(async (event) => {
        const text = `${event.title} ${event.description || ''} ${event.category} ${event.location}`;
        const eventEmbedding = await generateEmbedding(text);
        
        const similarity = cosineSimilarity(queryEmbedding, eventEmbedding);
        
        return { ...event, similarity };
      })
    );

    eventsWithScores.sort((a, b) => b.similarity - a.similarity);

    return {
      events: eventsWithScores.slice(0, limit),
      query,
      searchType: 'semantic'
    };
  } catch (error) {
    logger.error('Semantic search error:', error.message);
    throw error;
  }
};

const cosineSimilarity = (a, b) => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magA === 0 || magB === 0) return 0;
  
  return dotProduct / (magA * magB);
};

export const improveEventDescription = async (currentDescription, title, category) => {
  const systemPrompt = `You are a professional copywriter specializing in event descriptions. Improve the given description to make it more engaging and compelling. Keep it 150-250 words.`;

  const userPrompt = `Improve this event description:

Current description:
${currentDescription}

Event: ${title}
Category: ${category}

Make it more:
- Engaging and exciting
- Clear about what attendees will experience
- Compelling enough to drive ticket sales

Return ONLY the improved description, no explanations.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return chatCompletion(messages, 0.8);
};

export default {
  generateEventDescription,
  getEventRecommendations,
  semanticSearch,
  improveEventDescription,
  generateEmbedding
};