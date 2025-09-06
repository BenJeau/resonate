# Resonate

A music guessing game that challenges players to identify songs from short audio snippets. Built with React, TypeScript, and Vite, Resonate integrates with Spotify to provide an engaging music discovery experience.

## Synopsis

Resonate is an interactive music guessing game where players listen to brief audio clips and try to identify the correct song and artist. The game features:

- **Spotify Integration**: Authenticate with your Spotify account to access your playlists and top tracks
- **Multiple Game Modes**: Choose from your personal playlists or popular Spotify playlists
- **Flexible Gameplay**: Select 3, 10, or 20 tracks per game session
- **Smart Scoring**: Uses fuzzy string matching to accept close guesses for song titles and artists
- **Beautiful UI**: Modern, responsive design with animated backgrounds and smooth transitions
- **Game History**: Track your performance across different sessions

The game presents players with a short audio snippet (typically a few seconds) and multiple choice options. Players must identify both the song title and artist to score points. The scoring system is forgiving, accepting variations in spelling and formatting to make the game more enjoyable.

## Tech Stack

This project is built with modern web technologies:

- **React 19** - UI framework with hooks and modern patterns
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **TanStack Router** - Type-safe routing for React
- **Tailwind CSS** - Utility-first CSS framework
- **Spotify Web API** - Music data and authentication
- **PKCE OAuth** - Secure authentication flow

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Spotify Developer account and app credentials

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your Spotify app credentials in the environment or configuration
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

The project uses several development tools:

- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **Vite** - Hot module replacement for fast development

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint to check for code issues

## Features

### Game Mechanics

- **Audio Snippets**: Listen to short clips from your favorite songs
- **Multiple Choice**: Choose from 4 possible answers per question
- **Scoring System**: Points awarded for correct song and artist identification
- **Fuzzy Matching**: Smart scoring that accepts close variations in spelling

### Spotify Integration

- **OAuth Authentication**: Secure login with Spotify using PKCE flow
- **Playlist Selection**: Choose from your personal playlists or popular ones
- **Track Access**: Access to your top tracks and saved music
- **Real-time Data**: Fresh music data from Spotify's API

### User Experience

- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark UI with emerald accents
- **Smooth Animations**: Engaging visual feedback and transitions
- **Game History**: Track your performance over time

## Contributing

This project uses ESLint for code quality. The configuration can be extended with additional rules for production use. See the ESLint configuration in `eslint.config.js` for current settings.
