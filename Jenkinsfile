pipeline {
    agent any

    stages {

        stage('Clone Repo') {
            steps {
                git 'YOUR_GITHUB_REPO_URL'
            }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run build || echo "No build step"'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploy step here"
            }
        }
    }
}
