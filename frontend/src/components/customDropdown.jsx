import React, { useEffect, useId, useMemo, useRef, useState, useCallback } from "react";
import { useSelector } from 'react-redux';

const IconEmoji = ({ emoji }) => (
  <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
);

const IconChevron = ({ open }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transition: "transform 0.2s ease",
      transform: open ? "rotate(180deg)" : "none",
    }}
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12l5 5L20 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SIZE = {
  sm: { trigger: { height: 36, padding: "0 12px", fontSize: 13 }, search: 32, optHeight: 36, optFont: 13 },
  md: { trigger: { height: 44, padding: "0 14px", fontSize: 14 }, search: 36, optHeight: 40, optFont: 14 },
  lg: { trigger: { height: 52, padding: "0 18px", fontSize: 16 }, search: 44, optHeight: 48, optFont: 16 },
};

const BASE = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  boxSizing: "border-box",
  WebkitFontSmoothing: "antialiased",
};

const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  label = null,
  icon = null,
  withIcons = false,
  className = "",
  disabled = false,
  searchable,
  searchPlaceholder = "Search...",
  noOptionsMessage = "No options found",
  size = "md",
  error = null,
  helperText = null,
  clearable = false,
  disabledOptions = [],
  closeOnSelect = true,
  position = "auto",
  groupBy = null,
  onOpen = null,
  onClose = null,
  onSearch = null,
  renderOption = null,
  renderValue = null,
  renderEmptyState = null,
}) => {
  // Get dark mode from Redux
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [resolvedPosition, setResolvedPosition] = useState(position === "auto" ? "bottom" : position);

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const menuId = useId();
  const labelId = useId();

  const sz = SIZE[size] ?? SIZE.md;
  const isSearchable = searchable ?? options.length > 8;

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const isDisabled = useCallback(
    (v) => disabledOptions.includes(v),
    [disabledOptions]
  );

  const groupedMap = useMemo(() => {
    if (!groupBy) return null;
    const map = {};
    options.forEach((o) => {
      const key = typeof groupBy === "function" ? groupBy(o) : o[groupBy] ?? "Other";
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [options, groupBy]);

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const match = (o) =>
      !q ||
      String(o.label ?? "").toLowerCase().includes(q) ||
      String(o.value ?? "").toLowerCase().includes(q) ||
      (o.tags ?? []).some((t) => t.toLowerCase().includes(q));

    if (groupedMap) {
      const out = {};
      Object.entries(groupedMap).forEach(([g, list]) => {
        const filtered = list.filter(match);
        if (filtered.length) out[g] = filtered;
      });
      return out;
    }
    return options.filter(match);
  }, [options, searchTerm, groupedMap]);

  const flatOptions = useMemo(() => {
    if (!groupedMap) return filteredOptions;
    return Object.values(filteredOptions).flat();
  }, [filteredOptions, groupedMap]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(0);
    onClose?.();
  }, [onClose]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    onOpen?.();

    if (position === "auto" && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setResolvedPosition(spaceBelow < 280 && rect.top > spaceBelow ? "top" : "bottom");
    } else {
      setResolvedPosition(position === "auto" ? "bottom" : position);
    }
  }, [disabled, onOpen, position]);

  useEffect(() => {
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) closeDropdown();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeDropdown]);

  useEffect(() => {
    if (isOpen && isSearchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen, isSearchable]);

  useEffect(() => {
    if (!isOpen) return;
    const idx = flatOptions.findIndex((o) => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlightedIndex}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback(
    (option) => {
      if (isDisabled(option.value)) return;
      onChange?.(option.value);
      onSearch?.(searchTerm);
      if (closeOnSelect) {
        closeDropdown();
        triggerRef.current?.focus();
      }
    },
    [onChange, closeOnSelect, closeDropdown, isDisabled, onSearch, searchTerm]
  );

  const moveHighlight = useCallback(
    (delta) => {
      const enabled = flatOptions.filter((o) => !isDisabled(o.value));
      if (!enabled.length) return;
      setHighlightedIndex((cur) => {
        const max = flatOptions.length - 1;
        let next = cur + delta;
        if (next < 0) next = max;
        if (next > max) next = 0;
        let attempts = 0;
        while (isDisabled(flatOptions[next]?.value) && attempts < flatOptions.length) {
          next = (next + delta + flatOptions.length) % flatOptions.length;
          attempts++;
        }
        return next;
      });
    },
    [flatOptions, isDisabled]
  );

  const handleTriggerKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          isOpen ? moveHighlight(1) : openDropdown();
          break;
        case "ArrowUp":
          e.preventDefault();
          isOpen ? moveHighlight(-1) : openDropdown();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen && flatOptions[highlightedIndex]) {
            handleSelect(flatOptions[highlightedIndex]);
          } else {
            openDropdown();
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "Delete":
        case "Backspace":
          if (clearable && selectedOption && !isOpen) {
            e.preventDefault();
            onChange?.(null);
          }
          break;
        default:
          if (isSearchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (!isOpen) openDropdown();
            setTimeout(() => searchRef.current?.focus(), 0);
          }
      }
    },
    [disabled, isOpen, moveHighlight, openDropdown, flatOptions, highlightedIndex, handleSelect, closeDropdown, clearable, selectedOption, onChange, isSearchable]
  );

  const handleMenuKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); moveHighlight(1); break;
        case "ArrowUp": e.preventDefault(); moveHighlight(-1); break;
        case "Home": e.preventDefault(); setHighlightedIndex(0); break;
        case "End": e.preventDefault(); setHighlightedIndex(Math.max(flatOptions.length - 1, 0)); break;
        case "Enter": e.preventDefault(); if (flatOptions[highlightedIndex]) handleSelect(flatOptions[highlightedIndex]); break;
        case "Escape": e.preventDefault(); closeDropdown(); triggerRef.current?.focus(); break;
        case "Tab": closeDropdown(); break;
      }
    },
    [moveHighlight, flatOptions, highlightedIndex, handleSelect, closeDropdown]
  );

  // Dark mode styles
  const darkModeStyles = {
    background: isDark ? '#1e1e2e' : '#ffffff',
    borderColor: isDark ? '#334155' : '#d1d5db',
    textColor: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#94a3b8' : '#6b7280',
    hoverBg: isDark ? '#334155' : '#f3f4f6',
    selectedBg: isDark ? '#4f46e5' : '#4f46e5',
    selectedText: '#ffffff',
    disabledText: isDark ? '#475569' : '#9ca3af',
    borderActive: '#6366f1',
    placeholderColor: isDark ? '#64748b' : '#9ca3af',
    errorColor: '#ef4444',
    badgeBg: isDark ? '#4f46e5' : '#e0e7ff',
    badgeText: '#ffffff',
    shadow: isDark ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.12)',
  };

  const renderOptionItem = (option, index) => {
    const isSelected = value === option.value;
    const isHighlighted = index === highlightedIndex;
    const isItemDisabled = isDisabled(option.value);

    if (renderOption) {
      return renderOption({
        option, isSelected, isHighlighted, isDisabled: isItemDisabled,
        onSelect: () => handleSelect(option),
        onMouseEnter: () => setHighlightedIndex(index),
      });
    }

    return (
      <button
        key={String(option.value)}
        type="button"
        role="option"
        tabIndex={-1}
        data-idx={index}
        aria-selected={isSelected}
        aria-disabled={isItemDisabled}
        disabled={isItemDisabled}
        onMouseEnter={() => !isItemDisabled && setHighlightedIndex(index)}
        onClick={() => !isItemDisabled && handleSelect(option)}
        style={{
          ...BASE,
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          height: sz.optHeight,
          padding: "0 16px",
          border: "none",
          borderRadius: 8,
          background: isSelected 
            ? darkModeStyles.selectedBg 
            : (isHighlighted && !isItemDisabled ? darkModeStyles.hoverBg : "transparent"),
          cursor: isItemDisabled ? "not-allowed" : "pointer",
          fontSize: sz.optFont,
          color: isSelected 
            ? darkModeStyles.selectedText 
            : (isItemDisabled ? darkModeStyles.disabledText : darkModeStyles.textColor),
          fontWeight: isSelected ? 600 : 400,
          textAlign: "left",
          transition: "all 0.15s ease",
          outline: "none",
        }}
      >
        {withIcons && option.icon && (
          typeof option.icon === 'string' 
            ? <span style={{ flexShrink: 0, fontSize: 18 }}>{option.icon}</span>
            : <span style={{ flexShrink: 0, fontSize: 18 }}>{option.icon}</span>
        )}
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {option.label}
        </span>
        {option.meta && (
          <span style={{ fontSize: sz.optFont - 1, color: darkModeStyles.textSecondary, flexShrink: 0 }}>
            {option.meta}
          </span>
        )}
        {option.badge && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 12,
            background: darkModeStyles.badgeBg,
            color: darkModeStyles.badgeText,
            flexShrink: 0,
          }}>
            {option.badge}
          </span>
        )}
        <span style={{ 
          flexShrink: 0, 
          color: isSelected ? darkModeStyles.selectedText : darkModeStyles.borderActive, 
          opacity: isSelected ? 1 : 0, 
          transition: "opacity 0.15s" 
        }}>
          <IconCheck />
        </span>
      </button>
    );
  };

  const renderContent = () => {
    const isEmpty = Array.isArray(filteredOptions) ? filteredOptions.length === 0 : Object.keys(filteredOptions).length === 0;

    if (isEmpty) {
      if (renderEmptyState) return renderEmptyState(searchTerm);
      return (
        <div style={{ padding: "24px 16px", textAlign: "center", color: darkModeStyles.textSecondary, fontSize: 14 }}>
          {searchTerm ? noOptionsMessage : "No options available"}
        </div>
      );
    }

    if (groupedMap) {
      return Object.entries(filteredOptions).map(([group, list]) => (
        <div key={group}>
          <div style={{
            padding: "12px 16px 8px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".05em",
            textTransform: "uppercase",
            color: darkModeStyles.textSecondary,
          }}>
            {group}
          </div>
          {list.map((opt) => renderOptionItem(opt, flatOptions.findIndex((o) => o.value === opt.value)))}
        </div>
      ));
    }

    return filteredOptions.map((opt, idx) => renderOptionItem(opt, idx));
  };

  const triggerContent = renderValue
    ? renderValue(selectedOption, placeholder)
    : selectedOption
    ? (
        <>
          {withIcons && selectedOption.icon && (
            typeof selectedOption.icon === 'string'
              ? <span style={{ fontSize: 18, display: "flex", alignItems: "center" }}>{selectedOption.icon}</span>
              : <span style={{ fontSize: 18, display: "flex", alignItems: "center" }}>{selectedOption.icon}</span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: darkModeStyles.textColor }}>
            {selectedOption.label}
          </span>
        </>
      )
    : (
        <span style={{ color: darkModeStyles.placeholderColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {placeholder}
        </span>
      );

  return (
    <div ref={rootRef} style={{ position: "relative", ...BASE }} className={className}>
      {label && (
        <label id={labelId} style={{ 
          display: "block", 
          fontSize: 13, 
          fontWeight: 600, 
          color: isDark ? '#94a3b8' : '#374151', 
          marginBottom: 6 
        }}>
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={!!error}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        style={{
          ...BASE,
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          ...sz.trigger,
          border: `1px solid ${error ? darkModeStyles.errorColor : (isOpen ? darkModeStyles.borderActive : darkModeStyles.borderColor)}`,
          borderRadius: 10,
          background: disabled ? (isDark ? '#2d2d3a' : '#f5f5f5') : (isDark ? '#1e1e2e' : '#ffffff'),
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          color: darkModeStyles.textColor,
          boxShadow: isOpen ? `0 0 0 3px ${darkModeStyles.borderActive}20` : "none",
          transition: "all 0.15s ease",
          outline: "none",
        }}
      >
        {icon && (
          <span style={{ flexShrink: 0, color: darkModeStyles.textSecondary, display: "flex", alignItems: "center" }}>
            {icon}
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {triggerContent}
        </span>

        {clearable && selectedOption && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear"
            onClick={(e) => { e.stopPropagation(); onChange?.(null); }}
            style={{
              ...BASE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "none",
              background: isDark ? '#334155' : '#f3f4f6',
              cursor: "pointer",
              color: isDark ? '#94a3b8' : '#6b7280',
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <span style={{ color: darkModeStyles.textSecondary, display: "flex", alignItems: "center", flexShrink: 0 }}>
          <IconChevron open={isOpen} />
        </span>
      </button>

      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: darkModeStyles.errorColor }}>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p style={{ margin: "4px 0 0", fontSize: 12, color: darkModeStyles.textSecondary }}>
          {helperText}
        </p>
      )}

      {isOpen && (
        <div
          id={menuId}
          role="listbox"
          aria-label={label ?? placeholder}
          onKeyDown={handleMenuKeyDown}
          style={{
            ...BASE,
            position: "absolute",
            zIndex: 9999,
            width: "100%",
            minWidth: "min(100%, 280px)",
            background: darkModeStyles.background,
            border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: darkModeStyles.shadow,
            ...(resolvedPosition === "top" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }),
            animation: resolvedPosition === "top" ? "dropInUp 0.15s ease-out" : "dropIn 0.15s ease-out",
          }}
        >
          <style>{`
            @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
            @keyframes dropInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          `}</style>

          {isSearchable && options.length > 0 && (
            <div style={{ 
              padding: 10, 
              borderBottom: `1px solid ${isDark ? '#334155' : '#f3f4f6'}`, 
              position: "relative", 
              background: darkModeStyles.background 
            }}>
              <span style={{ 
                position: "absolute", 
                left: 20, 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: darkModeStyles.textSecondary, 
                pointerEvents: "none", 
                display: "flex" 
              }}>
                <IconSearch />
              </span>
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(0); onSearch?.(e.target.value); }}
                onKeyDown={handleMenuKeyDown}
                placeholder={searchPlaceholder}
                autoComplete="off"
                spellCheck={false}
                style={{
                  ...BASE,
                  display: "block",
                  width: "100%",
                  height: sz.search,
                  padding: "0 12px 0 38px",
                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  borderRadius: 8,
                  background: isDark ? '#0a0a0a' : '#f9fafb',
                  fontSize: sz.optFont - 1,
                  color: darkModeStyles.textColor,
                  outline: "none",
                  transition: "all 0.15s ease",
                }}
                onFocus={(e) => { 
                  e.target.style.borderColor = darkModeStyles.borderActive; 
                  e.target.style.background = isDark ? '#1e1e2e' : '#ffffff';
                }}
                onBlur={(e) => { 
                  e.target.style.borderColor = isDark ? '#334155' : '#e5e7eb'; 
                  e.target.style.background = isDark ? '#0a0a0a' : '#f9fafb';
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Clear search"
                  onClick={() => { setSearchTerm(""); setHighlightedIndex(0); searchRef.current?.focus(); }}
                  onKeyDown={(e) => e.stopPropagation()}
                  style={{
                    ...BASE,
                    position: "absolute",
                    right: 18,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    background: isDark ? '#334155' : '#e5e7eb',
                    cursor: "pointer",
                    color: isDark ? '#94a3b8' : '#6b7280',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div ref={listRef} style={{ overflowY: "auto", maxHeight: "min(260px, 50vh)", padding: 6 }}>
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;