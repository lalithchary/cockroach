// State management
let sessions = [];
let currentSessionId = null;
let isGenerating = false;
let theme = 'dark';

// DOM elements
const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    newChat: document.getElementById('new-chat'),
    newChatSidebar: document.getElementById('new-chat-sidebar'),
    clearChat: document.getElementById('clear-chat'),
    renameSession: document.getElementById('rename-session'),
    exportChat: document.getElementById('export-chat'),
    copyLast: document.getElementById('copy-last'),
    scrollBottom: document.getElementById('scroll-bottom'),
    stopGeneration: document.getElementById('stop-generation'),
    regenerate: document.getElementById('regenerate'),
    themeToggle: document.getElementById('theme-toggle'),
    searchSessions: document.getElementById('search-sessions'),
    sessionsList: document.getElementById('sessions-list'),
    welcomePanel: document.getElementById('welcome-panel'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    attachButton: document.getElementById('attach-button'),
    voiceButton: document.getElementById('voice-button'),
    charCounter: document.getElementById('char-counter'),
    statusIndicator: document.getElementById('status-indicator')
};

// Initialize app
function init() {
    loadTheme();
    createNewSession();
    setupEventListeners();
    renderSessions();
    updateUI();
}

// Theme management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        theme = savedTheme;
        document.body.classList.toggle('light', theme === 'light');
    }
}

function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
}

// Session management
function createNewSession() {
    const session = {
        id: Date.now().toString(),
        title: 'New Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: []
    };
    sessions.unshift(session);
    currentSessionId = session.id;
    updateUI();
}

function getCurrentSession() {
    return sessions.find(s => s.id === currentSessionId);
}

function updateSessionTitle(sessionId, title) {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        session.title = title;
        session.updatedAt = new Date();
        renderSessions();
    }
}

function deleteSession(sessionId) {
    sessions = sessions.filter(s => s.id !== sessionId);
    if (currentSessionId === sessionId) {
        currentSessionId = sessions.length > 0 ? sessions[0].id : null;
        if (!currentSessionId) createNewSession();
    }
    renderSessions();
    updateUI();
}

function duplicateSession(sessionId) {
    const original = sessions.find(s => s.id === sessionId);
    if (original) {
        const duplicate = {
            ...original,
            id: Date.now().toString(),
            title: `${original.title} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        sessions.unshift(duplicate);
        currentSessionId = duplicate.id;
        renderSessions();
        updateUI();
    }
}

function clearCurrentSession() {
    const session = getCurrentSession();
    if (session) {
        session.messages = [];
        session.title = 'New Chat';
        session.updatedAt = new Date();
        renderSessions();
        updateUI();
    }
}

function exportChat() {
    const session = getCurrentSession();
    if (!session || session.messages.length === 0) return;

    const content = session.messages.map(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `**${role}:**\n${msg.content}\n\n`;
    }).join('');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// Message management
function addMessage(role, content) {
    const session = getCurrentSession();
    if (!session) return;

    const message = {
        id: Date.now().toString(),
        role,
        content,
        timestamp: new Date()
    };

    session.messages.push(message);
    session.updatedAt = new Date();

    // Auto-generate title from first user message
    if (role === 'user' && session.messages.length === 1) {
        session.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    renderMessages();
    renderSessions();
    scrollToBottom();
}

function regenerateLastMessage() {
    const session = getCurrentSession();
    if (!session || session.messages.length === 0) return;

    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage.role === 'assistant') {
        session.messages.pop();
        sendMessage(session.messages[session.messages.length - 1].content);
    }
}

function editMessage(messageId, newContent) {
    const session = getCurrentSession();
    if (!session) return;

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && session.messages[messageIndex].role === 'user') {
        session.messages[messageIndex].content = newContent;
        // Remove subsequent messages
        session.messages = session.messages.slice(0, messageIndex + 1);
        renderMessages();
        // Regenerate response
        sendMessage(newContent);
    }
}

function copyMessage(content) {
    navigator.clipboard.writeText(content);
}

function copyLastResponse() {
    const session = getCurrentSession();
    if (!session) return;

    const lastAssistant = session.messages.slice().reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
        copyMessage(lastAssistant.content);
    }
}

// Puter.js adapter
async function sendToModel(messages) {
    try {
        updateStatus('Generating');

        // Check if Puter.js has Grok 4.3 support
        if (typeof puter !== 'undefined' && puter.ai && puter.ai.chat) {
            // Try real Puter.js call
            const response = await puter.ai.chat({
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                model: 'grok-4.3'
            });
            return response.message.content;
        } else {
            // Mock fallback
            updateStatus('Mock Mode');
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            return generateMockResponse(messages[messages.length - 1].content);
        }
    } catch (error) {
        updateStatus('Error');
        console.error('Model error:', error);
        return 'Sorry, I encountered an error. Please try again.';
    } finally {
        updateStatus('Ready');
    }
}

function generateMockResponse(userMessage) {
    const responses = [
        "That's an interesting question! Let me think about it.",
        "Based on what you've shared, here's my perspective...",
        "I understand your concern. Here's what I think:",
        "Great point! To expand on that...",
        "That's a complex topic. Let me break it down for you."
    ];

    const baseResponse = responses[Math.floor(Math.random() * responses.length)];

    if (userMessage.toLowerCase().includes('code')) {
        return `${baseResponse}\n\nHere's a simple example:\n\n\`\`\`javascript\nfunction example() {\n    console.log('Hello, world!');\n}\n\`\`\`\n\nThis demonstrates the basic structure.`;
    }

    return `${baseResponse} ${userMessage.length > 20 ? 'Your message shows you have a good understanding of the topic.' : 'Feel free to provide more details for a more specific answer.'}`;
}

// UI rendering
function renderSessions() {
    const searchTerm = elements.searchSessions.value.toLowerCase();
    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchTerm)
    );

    const grouped = groupSessionsByDate(filteredSessions);

    elements.sessionsList.innerHTML = '';

    Object.entries(grouped).forEach(([group, groupSessions]) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'session-group';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'session-group-title';
        titleDiv.textContent = group;
        groupDiv.appendChild(titleDiv);

        groupSessions.forEach(session => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'session-title';
            titleSpan.textContent = session.title;
            itemDiv.appendChild(titleSpan);

            const menuDiv = document.createElement('div');
            menuDiv.className = 'session-menu';
            menuDiv.innerHTML = `
                <button class="message-action" data-action="rename" title="Rename">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="message-action" data-action="duplicate" title="Duplicate">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                </button>
                <button class="message-action" data-action="delete" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            `;
            itemDiv.appendChild(menuDiv);

            itemDiv.addEventListener('click', (e) => {
                if (!e.target.closest('.message-action')) {
                    switchSession(session.id);
                }
            });

            menuDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.closest('.message-action')?.dataset.action;
                if (action === 'rename') {
                    const newTitle = prompt('Enter new title:', session.title);
                    if (newTitle) updateSessionTitle(session.id, newTitle);
                } else if (action === 'duplicate') {
                    duplicateSession(session.id);
                } else if (action === 'delete') {
                    if (confirm('Delete this session?')) deleteSession(session.id);
                }
            });

            groupDiv.appendChild(itemDiv);
        });

        elements.sessionsList.appendChild(groupDiv);
    });
}

function groupSessionsByDate(sessions) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = { Today: [], Yesterday: [], Older: [] };

    sessions.forEach(session => {
        const sessionDate = new Date(session.updatedAt);
        if (sessionDate >= today) {
            groups.Today.push(session);
        } else if (sessionDate >= yesterday) {
            groups.Yesterday.push(session);
        } else {
            groups.Older.push(session);
        }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
        if (groups[key].length === 0) delete groups[key];
    });

    return groups;
}

function switchSession(sessionId) {
    currentSessionId = sessionId;
    renderSessions();
    updateUI();
}

function renderMessages() {
    const session = getCurrentSession();
    if (!session) return;

    elements.messages.innerHTML = '';

    if (session.messages.length === 0) {
        elements.welcomePanel.style.display = 'flex';
        return;
    }

    elements.welcomePanel.style.display = 'none';

    session.messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = formatMessage(message.content);
        bubbleDiv.appendChild(contentDiv);

        if (message.role === 'assistant') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = `
                <button class="message-action" data-action="copy" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                </button>
                <button class="message-action" data-action="regenerate" title="Regenerate">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23,4 23,10 17,10"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                    </svg>
                </button>
                <button class="message-action" data-action="thumbs-up" title="Good response">
                    👍
                </button>
                <button class="message-action" data-action="thumbs-down" title="Bad response">
                    👎
                </button>
            `;
            actionsDiv.addEventListener('click', (e) => {
                const action = e.target.closest('.message-action')?.dataset.action;
                if (action === 'copy') {
                    copyMessage(message.content);
                } else if (action === 'regenerate') {
                    regenerateLastMessage();
                }
                // Thumbs up/down could be implemented with feedback system
            });
            bubbleDiv.appendChild(actionsDiv);
        } else if (message.role === 'user') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = `
                <button class="message-action" data-action="edit" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            `;
            actionsDiv.addEventListener('click', (e) => {
                const action = e.target.closest('.message-action')?.dataset.action;
                if (action === 'edit') {
                    const newContent = prompt('Edit message:', message.content);
                    if (newContent && newContent !== message.content) {
                        editMessage(message.id, newContent);
                    }
                }
            });
            bubbleDiv.appendChild(actionsDiv);
        }

        messageDiv.appendChild(bubbleDiv);
        elements.messages.appendChild(messageDiv);
    });
}

function formatMessage(content) {
    // Simple markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || '';
            const escapedCode = escapeHtml(code.trim());
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-language">${language}</span>
                    <div class="code-actions">
                        <button class="code-action" onclick="copyCode(this)">Copy</button>
                        <button class="code-action" onclick="toggleWrap(this)">Wrap</button>
                    </div>
                </div>
                <pre><code class="language-${language}">${escapedCode}</code></pre>
            </div>`;
        });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyCode(button) {
    const pre = button.closest('.code-block').querySelector('pre');
    const code = pre.textContent;
    navigator.clipboard.writeText(code);
    button.textContent = 'Copied!';
    setTimeout(() => button.textContent = 'Copy', 2000);
}

function toggleWrap(button) {
    const pre = button.closest('.code-block').querySelector('pre');
    pre.style.whiteSpace = pre.style.whiteSpace === 'pre-wrap' ? 'pre' : 'pre-wrap';
    button.textContent = pre.style.whiteSpace === 'pre-wrap' ? 'Unwrap' : 'Wrap';
}

function updateUI() {
    renderMessages();
    updateCharCounter();
    updateButtons();
}

function updateCharCounter() {
    const length = elements.messageInput.value.length;
    elements.charCounter.textContent = `${length}/4000`;
}

function updateButtons() {
    const session = getCurrentSession();
    const hasMessages = session && session.messages.length > 0;
    const hasAssistantMessages = session && session.messages.some(m => m.role === 'assistant');

    elements.clearChat.disabled = !hasMessages;
    elements.exportChat.disabled = !hasMessages;
    elements.copyLast.disabled = !hasAssistantMessages;
    elements.regenerate.disabled = !hasAssistantMessages;
    elements.renameSession.disabled = !session;
    elements.sendButton.disabled = isGenerating || !elements.messageInput.value.trim();
}

function updateStatus(status) {
    elements.statusIndicator.textContent = status;
    isGenerating = status === 'Generating';
    updateButtons();
}

// Event listeners
function setupEventListeners() {
    // Sidebar
    elements.sidebarToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });

    elements.newChat.addEventListener('click', createNewSession);
    elements.newChatSidebar.addEventListener('click', createNewSession);

    elements.clearChat.addEventListener('click', () => {
        if (confirm('Clear all messages in this chat?')) clearCurrentSession();
    });

    elements.renameSession.addEventListener('click', () => {
        const session = getCurrentSession();
        if (session) {
            const newTitle = prompt('Enter new title:', session.title);
            if (newTitle) updateSessionTitle(session.id, newTitle);
        }
    });

    elements.exportChat.addEventListener('click', exportChat);
    elements.copyLast.addEventListener('click', copyLastResponse);
    elements.regenerate.addEventListener('click', regenerateLastMessage);
    elements.themeToggle.addEventListener('click', toggleTheme);

    elements.scrollBottom.addEventListener('click', scrollToBottom);
    elements.stopGeneration.addEventListener('click', () => {
        // In a real implementation, this would cancel the ongoing request
        updateStatus('Ready');
    });

    // Search
    elements.searchSessions.addEventListener('input', renderSessions);

    // Composer
    elements.messageInput.addEventListener('input', () => {
        updateCharCounter();
        updateButtons();
        autoResizeTextarea();
    });

    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    elements.sendButton.addEventListener('click', sendMessage);

    // Example prompts
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            elements.messageInput.value = chip.textContent;
            updateCharCounter();
            updateButtons();
            autoResizeTextarea();
        });
    });
}

function autoResizeTextarea() {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 120) + 'px';
}

async function sendMessage(messageText) {
    const text = messageText || elements.messageInput.value.trim();
    if (!text || isGenerating) return;

    elements.messageInput.value = '';
    updateCharCounter();
    autoResizeTextarea();

    addMessage('user', text);

    const session = getCurrentSession();
    const messages = session.messages.map(m => ({ role: m.role, content: m.content }));

    const response = await sendToModel(messages);
    addMessage('assistant', response);
}

function scrollToBottom() {
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

// Initialize
init();