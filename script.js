document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const quickReplies = document.querySelectorAll('.quick-reply-btn');
    const emergencyBtn = document.getElementById('emergency-btn');
    const emergencyModal = document.getElementById('emergency-modal');
    const closeEmergency = document.getElementById('close-emergency');
    const understandEmergency = document.getElementById('understand-emergency');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const sendBtn = document.getElementById('send-btn');

    // --- State ---
    let isWaitingForResponse = false;

    // --- Theme Management ---
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    });

    // --- Auto-resize textarea ---
    messageInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value.trim() !== '') {
            sendBtn.style.color = 'var(--primary-color)';
        } else {
            sendBtn.style.color = '';
        }
    });

    messageInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const msg = messageInput.value.trim();
            handleSubmission(msg);
        }
    });

    // --- Emergency Modal ---
    const openModal = () => emergencyModal.classList.add('active');
    const closeModal = () => emergencyModal.classList.remove('active');

    emergencyBtn.addEventListener('click', openModal);
    closeEmergency.addEventListener('click', closeModal);
    understandEmergency.addEventListener('click', closeModal);
    emergencyModal.addEventListener('click', (e) => {
        if (e.target === emergencyModal) closeModal();
    });

    // --- Chat Functionality ---
    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function addMessage(content, isAi = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isAi ? 'ai-wrapper' : 'user-wrapper'}`;

        let avatarHtml = '';
        if (isAi) {
            avatarHtml = `
            <div class="avatar ai-avatar">
                <i class="fa-solid fa-brain"></i>
            </div>`;
        }

        const msgClass = isAi ? 'ai-message' : 'user-message';
        const time = formatTime(new Date());

        wrapper.innerHTML = `
            ${avatarHtml}
            <div class="message ${msgClass}">
                ${formatText(content)}
                <div class="time-stamp">${time}</div>
            </div>
        `;

        chatContainer.appendChild(wrapper);
        scrollToBottom();
    }

    function formatText(text) {
        // Simple formatting for bold and lists to make responses look richer
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    async function handleSubmission(message) {
        if (!message || isWaitingForResponse) return;

        // 1. Add User Message
        addMessage(message, false);
        messageInput.value = '';
        messageInput.style.height = 'auto'; // reset height
        sendBtn.style.color = '';

        // 2. Show Typing Indicator
        isWaitingForResponse = true;
        typingIndicator.style.display = 'flex';
        scrollToBottom();

        try {
            // 3. Get AI Response from Backend Gemini API
            const response = await fetch('/ai_reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();
            
            typingIndicator.style.display = 'none';
            addMessage(data.reply || "I'm sorry, I'm having trouble thinking right now.", true);
            
        } catch (error) {
            console.error("Chat Error:", error);
            typingIndicator.style.display = 'none';
            addMessage("I'm sorry, but I've encountered a connection issue. Please try again in a moment.", true);
        } finally {
            isWaitingForResponse = false;
        }
    }

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = messageInput.value.trim();
        handleSubmission(msg);
    });

    quickReplies.forEach(btn => {
        btn.addEventListener('click', () => {
            const msg = btn.innerText;
            handleSubmission(msg);
            // Optional: Hide quick replies after use
            // document.getElementById('quick-replies').style.display = 'none';
        });
    });

    clearChatBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear the chat history?")) {
            const messages = document.querySelectorAll('.message-wrapper:not(:first-child)');
            messages.forEach(msg => msg.remove());
        }
    });
});
