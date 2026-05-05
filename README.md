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

The app attempts to use Puter.js for AI model calls:

```javascript
// In app.js, the sendToModel function tries:
if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
    const response = await puter.ai.chat({
        messages: messages,
        model: 'grok-4.3'
    });
    return response.message.content;
}
```

If Puter.js is not available or doesn't support Grok 4.3, it falls back to a mock implementation that simulates responses.

To integrate with a real AI service:
1. Modify the `sendToModel` function in `app.js`
2. Replace the Puter.js call with your preferred AI API
3. Update the status indicator logic as needed

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