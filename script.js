document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:5000" // Flask server

  const sendButton = document.getElementById("sendButton")
  const sendButton2 = document.getElementById("sendButton2")
  const questionInputElement = document.getElementById("questionInput")
  const questionInputElement2 = document.getElementById("questionInput2")
  const newChatButton = document.getElementById("newChatButton")
  const chatMessages = document.getElementById("chatMessages")
  const chatHistory = document.getElementById("chat-history")
  const chatForm = document.getElementById("chatForm")
  const chatForm2 = document.getElementById("chatForm2")
  const stopButton = document.getElementById("stopButton")
  const logoutButton = document.getElementById("logoutButton")
  const sidebarToggle = document.getElementById("sidebarToggle")
  const sidebar = document.getElementById("sidebar")
  const searchHistoryInput = document.getElementById("searchHistory")
  const overlay = document.getElementById("overlay")

  const allButtons = document.querySelectorAll(".example-btn, .capability-btn, .limitation-btn")

  let conversationHistory = []
  let stopTyping = false
  let allChatHistory = []

  // Toggle sidebar on mobile
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar-open")
      overlay.classList.toggle("hidden")
    })
  }

  // Close sidebar when clicking overlay
  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("sidebar-open")
      overlay.classList.add("hidden")
    })
  }

  // Search functionality for history
  if (searchHistoryInput) {
    searchHistoryInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()
      filterChatHistory(searchTerm)
    })
  }

  function filterChatHistory(searchTerm) {
    if (!chatHistory) return

    const historyItems = chatHistory.querySelectorAll(".chat-entry")
    historyItems.forEach((item) => {
      const text = item.textContent.toLowerCase()
      if (text.includes(searchTerm)) {
        item.style.display = "block"
      } else {
        item.style.display = "none"
      }
    })
  }

  async function postData(url = "", data = {}) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async function loadChatHistory() {
    const userId = document.getElementById("user_id")?.value
    if (!userId) {
      // For unauthenticated users, show a message instead of an alert
      const historyContainer = document.getElementById("chat-history")
      if (historyContainer) {
        historyContainer.innerHTML = "<p class='text-center p-4'>Please log in to view chat history.</p>"
      }
      return
    }

    try {
      const response = await fetch(`${API_URL}/get_history?user_id=${userId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      allChatHistory = data.history || []

      const historyContainer = document.getElementById("chat-history")
      if (!historyContainer) {
        console.error("Chat history container not found!")
        return
      }

      historyContainer.innerHTML = "" // Clear previous history

      if (allChatHistory.length > 0) {
        // Group chats by first question to create conversation groups
        const conversations = {}

        allChatHistory.forEach((chat) => {
          const truncatedQuestion = chat.question.substring(0, 30) + (chat.question.length > 30 ? "..." : "")
          if (!conversations[truncatedQuestion]) {
            conversations[truncatedQuestion] = []
          }
          conversations[truncatedQuestion].push(chat)
        })

        // Create history items for each conversation
        Object.keys(conversations).forEach((title) => {
          const chatEntry = document.createElement("div")
          chatEntry.className =
            "chat-entry p-3 border-b border-ninja-gray/20 hover:bg-ninja-gray/10 cursor-pointer transition-colors"
          chatEntry.innerHTML = `
            <div class="flex items-center gap-2">
              <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>${title}</span>
            </div>
          `

          // Add click event to load this conversation
          chatEntry.addEventListener("click", () => {
            loadConversation(conversations[title])
            // Close sidebar on mobile after selecting a conversation
            if (window.innerWidth < 768 && sidebar) {
              sidebar.classList.remove("sidebar-open")
              if (overlay) overlay.classList.add("hidden")
            }
          })

          historyContainer.appendChild(chatEntry)
        })
      } else {
        historyContainer.innerHTML = "<p class='text-center p-4'>No chat history found.</p>"
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
      const historyContainer = document.getElementById("chat-history")
      if (historyContainer) {
        historyContainer.innerHTML = "<p class='text-center p-4 text-red-500'>Failed to load chat history.</p>"
      }
    }
  }

  function loadConversation(conversation) {
    if (!conversation || conversation.length === 0) return

    // Clear current chat
    clearChat()

    // Show chat area
    const right1 = document.querySelector(".right1")
    const right2 = document.querySelector(".right2")
    if (right1 && right2) {
      right2.style.display = "block"
      right1.style.display = "none"
    }

    // Reset conversation history
    conversationHistory = []

    // Add each message to the chat
    conversation.forEach((chat) => {
      addMessageToChat(chat.question, true, false)
      addToConversationHistory(chat.question, true)

      addMessageToChat(chat.answer, false, false)
      addToConversationHistory(chat.answer, false)
    })

    // Scroll to bottom
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }

  function typeEffect(element, text, speed = 10) {
    return new Promise((resolve) => {
      let i = 0
      element.innerHTML = ""
      stopTyping = false
      function type() {
        if (i < text.length && !stopTyping) {
          element.innerHTML += text.charAt(i)
          i++
          setTimeout(type, speed)
        } else {
          if (stopButton) stopButton.classList.add("hidden")
          resolve()
        }
      }
      type()
    })
  }

  function sanitizeInput(input) {
    return input.replace(/[.]+$/, "").trim()
  }

  function addMessageToChat(message, isUser = false, animate = true) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `flex ${isUser ? "justify-end" : "justify-start"} ${animate ? "animate-fadeIn" : ""}`
    const innerDiv = document.createElement("div")
    innerDiv.className = `${isUser ? "bg-ninja-cyan text-ninja-dark" : "bg-ninja-gray text-white"} max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg shadow-md ${animate ? "animate-slideIn" : ""}`
    const paragraph = document.createElement("p")
    paragraph.className = "text-sm"
    messageDiv.appendChild(innerDiv)
    innerDiv.appendChild(paragraph)
    chatMessages.appendChild(messageDiv)

    if (animate) {
      typeEffect(paragraph, message).then(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight
      })
    } else {
      paragraph.textContent = message
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }

  function addToConversationHistory(message, isUser = false) {
    conversationHistory.push({ role: isUser ? "user" : "assistant", content: message })
  }

  function updateChatHistory(question) {
    const chatHistory = document.getElementById("chat-history")
    if (!chatHistory) {
      console.error("Chat history container not found!")
      return
    }

    const chatEntry = document.createElement("div")
    chatEntry.className =
      "chat-entry p-3 border-b border-ninja-gray/20 hover:bg-ninja-gray/10 cursor-pointer transition-colors"
    chatEntry.innerHTML = `
      <div class="flex items-center gap-2">
        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>${question.substring(0, 30)}${question.length > 30 ? "..." : ""}</span>
      </div>
    `

    // Add click event to reload this conversation
    chatEntry.addEventListener("click", () => {
      // This will be a new conversation, so we just focus on the input
      if (questionInputElement) {
        questionInputElement.focus()
      }
      // Close sidebar on mobile
      if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.remove("sidebar-open")
        if (overlay) overlay.classList.add("hidden")
      }
    })

    chatHistory.insertBefore(chatEntry, chatHistory.firstChild)
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    const questionInput = sanitizeInput(e.target.querySelector("input").value)
    if (!questionInput) return

    e.target.querySelector("input").value = ""
    if (sendButton) sendButton.disabled = true
    if (sendButton2) sendButton2.disabled = true

    const right1 = document.querySelector(".right1")
    const right2 = document.querySelector(".right2")
    if (right1 && right2) {
      right2.style.display = "block"
      right1.style.display = "none"
    }

    addMessageToChat(questionInput, true)
    addToConversationHistory(questionInput, true)
    updateChatHistory(questionInput)

    if (stopButton) stopButton.classList.remove("hidden")
    stopTyping = false

    const typingMessage = "Bot is typing"
    const typingDiv = document.createElement("div")
    typingDiv.className = "flex justify-start animate-fadeIn"
    const typingInnerDiv = document.createElement("div")
    typingInnerDiv.className = "bg-ninja-gray text-white max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg shadow-md"
    typingDiv.appendChild(typingInnerDiv)
    chatMessages.appendChild(typingDiv)

    let dots = 0
    const typingInterval = setInterval(() => {
      dots = (dots + 1) % 4
      typingInnerDiv.textContent = typingMessage + ".".repeat(dots)
    }, 500)

    try {
      const userId = document.getElementById("user_id")?.value
      const result = await postData(`${API_URL}/api`, {
        question: questionInput,
        history: conversationHistory,
        user_id: userId, // Include user_id in the request
      })
      clearInterval(typingInterval)
      typingDiv.remove()
      if (!stopTyping) {
        addMessageToChat(sanitizeInput(result.result || "No response from bot."))
        addToConversationHistory(sanitizeInput(result.result || "No response from bot."))
      }

      // Reload chat history after sending a message
      await loadChatHistory()
    } catch (error) {
      console.error("Error fetching data:", error)
      clearInterval(typingInterval)
      typingDiv.remove()
      if (stopButton) stopButton.classList.add("hidden")
      addMessageToChat("Sorry, there was an error.")
    } finally {
      if (sendButton) sendButton.disabled = false
      if (sendButton2) sendButton2.disabled = false
    }
  }

  function clearChat() {
    if (questionInputElement) questionInputElement.value = ""
    if (questionInputElement2) questionInputElement2.value = ""
    if (chatMessages) chatMessages.innerHTML = "" // Check for existence
    conversationHistory = []
    const right1 = document.querySelector(".right1")
    const right2 = document.querySelector(".right2")
    if (right1 && right2) {
      right1.style.display = "block"
      right2.style.display = "none"
    }
    if (stopButton) stopButton.classList.add("hidden")
  }

  async function handleLogout() {
    try {
      // Clear all chat data first
      clearChat()

      // Make a fetch request to the logout endpoint
      const response = await fetch("/logout")
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.redirect) {
        window.location.href = data.redirect // Redirect to the login page
      }
    } catch (error) {
      console.error("Error during logout:", error)
      alert("Failed to logout. Please try again.")
    }
  }

  // Check if we're on mobile and hide sections accordingly
  function checkMobileView() {
    const isMobile = window.innerWidth < 768
    const skillsSection = document.querySelector(".skills-section")
    const capabilitiesSection = document.querySelector(".capabilities-section")
    const limitationsSection = document.querySelector(".limitations-section")

    if (skillsSection) skillsSection.classList.toggle("hidden", isMobile)
    if (capabilitiesSection) capabilitiesSection.classList.toggle("hidden", isMobile)
    if (limitationsSection) limitationsSection.classList.toggle("hidden", isMobile)
  }

  // Event listeners
  if (chatForm) chatForm.addEventListener("submit", handleSendMessage)
  if (chatForm2) chatForm2.addEventListener("submit", handleSendMessage)

  if (stopButton) {
    stopButton.addEventListener("click", () => {
      stopTyping = true
    })
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout)
  }

  allButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const query = button.textContent
      if (questionInputElement) questionInputElement.value = sanitizeInput(query)
      if (chatForm) chatForm.dispatchEvent(new Event("submit"))
    })
  })

  if (newChatButton) {
    newChatButton.addEventListener("click", clearChat)
  }

  // Check mobile view on load and resize
  checkMobileView()
  window.addEventListener("resize", checkMobileView)

  // Load chat history when the page loads or when needed
  loadChatHistory()
})

// Login user function (if needed)
async function loginUser() {
  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "deku@ua.com", password: "oneforall" }),
  })
  const data = await response.json()
  if (data.redirect) {
    window.location.href = data.redirect
  } else {
    alert("Invalid Credentials")
  }
}
