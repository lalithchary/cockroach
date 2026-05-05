# cockroach 1.0

A premium dark-theme AI chat client for a Grok 4.3 style experience, built as a pure frontend static web app.

## Features

- **Multiple Chat Sessions**: Create, rename, duplicate, and delete chat sessions
- **Rich Message Rendering**: Support for paragraphs, headings, bullet lists, inline code, and fenced code blocks
- **Code Block Features**: Syntax highlighting, copy button, wrap/unwrap toggle
- **Responsive Design**: Desktop sidebar and mobile collapsible sidebar
- **Theme Toggle**: Switch between dark and light themes
- **Session Management**: Search, group by date (Today, Yesterday, Older)
- **Message Actions**: Copy, regenerate, edit, thumbs up/down
- **Export Functionality**: Download chats as Markdown files
- **Mock Fallback**: Graceful degradation when Puter.js integration is unavailable

## File Structure

```
cockroach/
├── index.html      # Main HTML structure
├── style.css       # Premium dark/light theme styles
├── app.js          # Application logic and state management
└── README.md       # This file
```

## Local Development

1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. The app runs entirely in the browser with no server required

## GitHub Pages Deployment

1. Upload all files to your GitHub repository
2. Enable GitHub Pages in repository settings
3. Select the main branch as the source
4. The app will be available at `https://yourusername.github.io/repository-name/`

## In-Memory Limitation

This app stores all data in memory only. Sessions and messages are lost when:
- The page is refreshed
- The browser tab is closed
- The browser is restarted

No data is persisted to localStorage or any backend storage.

## Puter.js Integration

The app loads Puter.js but uses a mock fallback for AI responses, as Puter.js AI features require the app to be hosted on the Puter platform with user authentication.

For real Puter.js integration:
1. Deploy the app on Puter (not GitHub Pages)
2. Ensure the user is authenticated with Puter
3. Uncomment and modify the Puter.js call in `sendToModel` function in `app.js`

Currently, the app always uses the mock implementation for demonstration purposes.

## Browser Compatibility

- Modern browsers with ES6+ support
- Tested on Chrome, Firefox, Safari, Edge
- Requires JavaScript enabled

## Customization

- **Styling**: Edit `style.css` for theme and layout changes
- **Logo**: Replace the inline SVG in `index.html`
- **Model**: Update the model name in `app.js` and the badge in `index.html`
- **Mock Responses**: Modify `generateMockResponse` function for different fallback behavior

## License

This project is open source. Feel free to modify and distribute.