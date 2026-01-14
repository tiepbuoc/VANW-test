const REVERSED_API_KEYc = "ADHvlJk9rfZ40q7ju_r-yVQl1ZqW4Z-MDySzAI";
const CHATBOT_API_KEY = REVERSED_API_KEYc.split('').reverse().join('');

let chats = [];
let currentChatId = null;
let isSending = false;
let isStopped = false;
let isSidebarVisible = false;
let quickReplyMessageId = null;
let isFirstMessage = false;
let apiDefenseSystem = null;
let currentGenAI = null;
let currentModel = null;

// ============================
// API PHÒNG THỦ HỆ THỐNG (Tương tự chatbot-l.html)
// ============================
class APIDefenseSystem {
    constructor() {
        // API key CHÍNH bị đảo ngược (giống code 2)
        this.reversedPrimaryApiKey = REVERSED_API_KEYc;
        this.primaryModel = "gemini-2.5-flash";
        this.allApis = [];
        this.workingApis = [];
        this.currentApiIndex = -1;
        this.isInitialized = false;
        this.consolePrefix = "🔧 [API Phòng Thủ]";
    }

    // Hàm đảo ngược chuỗi để lấy key đúng
    reverseApiKey(reversedKey) {
        if (!reversedKey || typeof reversedKey !== 'string') {
            console.error(`${this.consolePrefix} API key không hợp lệ:`, reversedKey);
            return reversedKey;
        }
        return reversedKey.split('').reverse().join('');
    }

    async initialize() {
        console.log(`${this.consolePrefix} === BẮT ĐẦU KIỂM TRA TẤT CẢ API ===`);
        console.log(`${this.consolePrefix} Lưu ý: Tất cả API key đều được đảo ngược, hệ thống sẽ tự động đảo lại`);
        
        // Thêm API chính vào danh sách (đã đảo ngược)
        this.allApis.push({
            reversedKey: this.reversedPrimaryApiKey,
            apiKey: this.reverseApiKey(this.reversedPrimaryApiKey),
            model: this.primaryModel,
            isPrimary: true,
            index: 0
        });
        
        // Load API dự phòng từ file
        await this.loadBackupApis();
        
        // Test tất cả API
        await this.testAllApisSequentially();
        
        // Chọn API hoạt động đầu tiên
        if (this.workingApis.length > 0) {
            this.currentApiIndex = 0;
            console.log(`${this.consolePrefix} === ĐÃ CHỌN API HOẠT ĐỘNG: #${this.workingApis[0].index} ===`);
            this.isInitialized = true;
            return this.workingApis[0];
        } else {
            console.error(`${this.consolePrefix} === KHÔNG CÓ API NÀO HOẠT ĐỘNG! ===`);
            throw new Error("KHÔNG CÓ API NÀO HOẠT ĐỘNG!");
        }
    }

    async loadBackupApis() {
        try {
            console.log(`${this.consolePrefix} === ĐANG TẢI API DỰ PHÒNG ===`);
            
            // Thử các đường dẫn khác nhau cho file apiphongthu.txt
            const possiblePaths = [
                'assets/apiphongthu.txt',
            ];
            
            let response = null;
            let usedPath = '';
            
            // Thử từng đường dẫn
            for (const path of possiblePaths) {
                try {
                    console.log(`${this.consolePrefix} Thử đường dẫn: ${path}`);
                    response = await fetch(path);
                    if (response.ok) {
                        usedPath = path;
                        console.log(`${this.consolePrefix} ✓ Tìm thấy file tại: ${path}`);
                        break;
                    }
                } catch (e) {
                    console.log(`${this.consolePrefix} ✗ Không tìm thấy file tại: ${path}`);
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                console.log(`${this.consolePrefix} Không tìm thấy file apiphongthu.txt, chỉ dùng API chính`);
                return false;
            }
            
            const text = await response.text();
            console.log(`${this.consolePrefix} Nội dung file (truncated):`, text.substring(0, 200) + "...");
            
            // Xử lý nội dung file
            const lines = text.trim().split('\n').filter(line => line.trim() !== '');
            
            console.log(`${this.consolePrefix} Số dòng trong file: ${lines.length}`);
            
            // Bắt đầu index từ 1 vì 0 là API chính
            let index = 1;
            
            // Xử lý từng cặp key-model
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (!line) continue;
                
                // Kiểm tra nếu dòng này có vẻ là API key
                if (line.includes('AIza')) {
                    const reversedKey = line;
                    const model = (i + 1 < lines.length) ? lines[i + 1].trim() : this.primaryModel;
                    
                    console.log(`${this.consolePrefix}\n[API #${index}]`);
                    
                    // Thử đảo ngược key để xem có hợp lệ không
                    const normalKey = this.reverseApiKey(reversedKey);
                    
                    // Kiểm tra nếu key đảo lại có chứa "AIza" (dấu hiệu của key hợp lệ)
                    const isValidKey = normalKey.includes("AIza");
                    
                    const apiKey = isValidKey ? normalKey : reversedKey;
                    
                    this.allApis.push({
                        reversedKey: reversedKey,
                        apiKey: apiKey,
                        model: model,
                        isPrimary: false,
                        index: index
                    });
                    
                    console.log(`${this.consolePrefix} Model: ${model}`);
                    console.log(`${this.consolePrefix} Type: BACKUP`);
                    console.log(`${this.consolePrefix} Key hợp lệ: ${isValidKey ? '✓' : '✗'}`);
                    
                    index++;
                    i++; // Bỏ qua dòng model
                } else if (line.toLowerCase().includes('gemini')) {
                    continue;
                } else {
                    // Thử xem có phải là key đảo ngược không
                    const normalKey = this.reverseApiKey(line);
                    const isValidKey = normalKey.includes("AIza");
                    
                    if (isValidKey) {
                        const model = (i + 1 < lines.length) ? lines[i + 1].trim() : this.primaryModel;
                        
                        this.allApis.push({
                            reversedKey: line,
                            apiKey: normalKey,
                            model: model,
                            isPrimary: false,
                            index: index
                        });
                        
                        console.log(`${this.consolePrefix} ✓ Phát hiện key đảo ngược API #${index}`);
                        index++;
                        i++;
                    }
                }
            }
            
            console.log(`${this.consolePrefix}\n=== KẾT QUẢ TẢI API DỰ PHÒNG ===`);
            console.log(`${this.consolePrefix} Đã tải ${this.allApis.length - 1} API dự phòng từ file`);
            console.log(`${this.consolePrefix} File path: ${usedPath}`);
            
            return true;
        } catch (error) {
            console.error(`${this.consolePrefix} Lỗi khi tải API dự phòng:`, error);
            return false;
        }
    }

    async testApiConnection(apiInfo) {
        try {
            console.log(`${this.consolePrefix}\n[TEST API #${apiInfo.index}]`);
            console.log(`${this.consolePrefix} Type: ${apiInfo.isPrimary ? 'PRIMARY' : 'BACKUP'}`);
            
            // Kiểm tra xem key có hợp lệ không
            if (!apiInfo.apiKey || apiInfo.apiKey.length < 20) {
                console.log(`${this.consolePrefix} [API #${apiInfo.index}] ✗ KEY KHÔNG HỢP LỆ (quá ngắn)`);
                return null;
            }
            
            // Kiểm tra xem key có chứa AIza không
            if (!apiInfo.apiKey.includes("AIza")) {
                console.log(`${this.consolePrefix} [API #${apiInfo.index}] ✗ KEY KHÔNG HỢP LỆ (thiếu 'AIza')`);
                return null;
            }
            
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiInfo.model || "gemini-2.5-flash"}:generateContent?key=${apiInfo.apiKey}`;
            
            // Test với câu hỏi đơn giản (timeout 5s)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: "Xin chào"
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 100,
                            temperature: 0.7,
                        }
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                console.log(`${this.consolePrefix} [API #${apiInfo.index}] ✓ HOẠT ĐỘNG TỐT`);
                
                return {
                    ...apiInfo,
                    status: 'working'
                };
            } catch (timeoutError) {
                console.log(`${this.consolePrefix} [API #${apiInfo.index}] ✗ TIMEOUT`);
                return null;
            }
        } catch (error) {
            console.log(`${this.consolePrefix} [API #${apiInfo.index}] ✗ LỖI: ${error.message}`);
            return null;
        }
    }

    async testAllApisSequentially() {
        this.workingApis = [];
        
        console.log(`${this.consolePrefix}\n=== BẮT ĐẦU KIỂM TRA ${this.allApis.length} API ===`);
        
        // Test tuần tự từng API
        for (let i = 0; i < this.allApis.length; i++) {
            const apiInfo = this.allApis[i];
            const result = await this.testApiConnection(apiInfo);
            
            if (result) {
                this.workingApis.push(result);
            }
            
            // Delay nhẹ giữa các lần test
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log(`${this.consolePrefix}\n=== KẾT QUẢ KIỂM TRA ===`);
        console.log(`${this.consolePrefix} ✓ API hoạt động: ${this.workingApis.length}/${this.allApis.length}`);
        
        if (this.workingApis.length === 0) {
            console.log(`${this.consolePrefix}\n⚠️ CẢNH BÁO: Không có API nào hoạt động!`);
        }
        
        return this.workingApis;
    }

    getCurrentApi() {
        if (this.workingApis.length === 0) return null;
        return this.workingApis[this.currentApiIndex];
    }

    async switchToNextApi() {
        if (this.workingApis.length <= 1) {
            console.log(`${this.consolePrefix} Không còn API dự phòng nào!`);
            return false;
        }
        
        // Tìm API hoạt động tiếp theo
        const nextIndex = (this.currentApiIndex + 1) % this.workingApis.length;
        this.currentApiIndex = nextIndex;
        
        console.log(`${this.consolePrefix} Đã chuyển sang API #${this.workingApis[nextIndex].index}`);
        return this.workingApis[nextIndex];
    }

    async tryAllApisForResponse(userMessage, conversationHistory) {
        console.log(`${this.consolePrefix}\n=== THỬ TẤT CẢ API ĐỂ TRẢ LỜI ===`);
        
        // Nếu không có API nào hoạt động
        if (this.workingApis.length === 0) {
            console.log(`${this.consolePrefix} Không có API nào hoạt động!`);
            return {
                success: false,
                error: "Không có API nào hoạt động"
            };
        }
        
        for (let i = 0; i < this.workingApis.length; i++) {
            const apiIndex = (this.currentApiIndex + i) % this.workingApis.length;
            const apiInfo = this.workingApis[apiIndex];
            
            console.log(`${this.consolePrefix} Thử API #${apiInfo.index}...`);
            
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiInfo.model || "gemini-2.5-flash"}:generateContent?key=${apiInfo.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: userMessage }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 2000,
                            temperature: 0.9,
                            topP: 0.1,
                            topK: 16,
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const botReply = data.candidates[0].content.parts[0].text.trim();
                
                // Cập nhật API hiện tại nếu thành công
                this.currentApiIndex = apiIndex;
                console.log(`${this.consolePrefix} ✓ Thành công với API #${apiInfo.index}`);
                
                return {
                    success: true,
                    response: botReply,
                    apiInfo: apiInfo
                };
            } catch (error) {
                console.log(`${this.consolePrefix} ✗ API #${apiInfo.index} lỗi: ${error.message}`);
                
                // Đánh dấu API này không hoạt động
                this.workingApis = this.workingApis.filter(api => api.index !== apiInfo.index);
                console.log(`${this.consolePrefix} Đã loại bỏ API #${apiInfo.index} khỏi danh sách hoạt động`);
                
                continue;
            }
        }
        
        console.log(`${this.consolePrefix} ✗ Tất cả API đều lỗi!`);
        return {
            success: false,
            error: "Tất cả API đều không hoạt động"
        };
    }
}

// ============================
// CÁC HÀM CHỨC NĂNG CHÍNH (Cập nhật theo chatbot-l.html)
// ============================
const literaryKeywords = [
    "văn học", "tác phẩm", "nhà văn", "thơ", "truyện", "tác giả", "chào", "là ai", 
    "tiểu thuyết", "chào", "bởi ai", "cảm hứng", "viết", "chữ", "từ", "câu", 
    "tóm tắt", "trình bầy", "tạo", "hoàn thiện", "văn", "trích", "nguồn gốc", 
    "từ", "văn","thơ","truyện","ca dao","tục ngữ","nhân vật","tác giả",
    "tác phẩm","thời kỳ","văn học","thơ ca","truyện ngắn","tiểu thuyết",
    "kịch","văn xuôi","lục bát","tự do","Đường luật","thơ mới","thơ cổ",
    "hiện đại","trữ tình","trào phúng","chữ Hán","chữ Nôm","chữ Quốc ngữ",
    "dân gian","cung đình","cách mạng","kháng chiến","hậu chiến","đương đại",
    "nước ngoài","thi pháp","ngôn ngữ","hình tượng","bút pháp","chủ đề",
    "tư tưởng","nghệ thuật","phong cách","vần đạo","thiền","tình yêu",
    "quê hương","chiến tranh","hòa bình","lịch sử","văn hóa","xã hội",
    "nhân đạo","hiện thực","lãng mạn","bi kịch","hài kịch","anh hùng",
    "phản diện","tâm lý","triết lý","tượng trưng","siêu thực","cổ điển",
    "hiện đại","hậu hiện đại","trung đại","cận đại","phục hưng","khai sáng",
    "lãng mạn","tự sự","trữ tình","tả thực","ẩn dụ","hoán dụ","nhân hóa",
    "so sánh","điệp ngữ","ẩn ý","tứ thơ","vần điệu","nhịp điệu","câu thơ",
    "đoạn thơ","bài thơ","tập thơ","tuyển tập","văn bản","bản dịch",
    "nguyên tác","tác phẩm kinh điển","tác phẩm tiêu biểu","tác phẩm nổi tiếng",
    "tác phẩm văn học","tác phẩm nghệ thuật","tác phẩm văn hóa",
    "tác phẩm lịch sử","tác phẩm triết học","tác phẩm tôn giáo",
    "tác phẩm chính trị","tác phẩm xã hội","tác phẩm nhân văn",
    "tác phẩm khoa học","tác phẩm giáo dục","tác phẩm văn minh"
];

function isLiteraryQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    return literaryKeywords.some(keyword => lowerQuestion.includes(keyword.toLowerCase()));
}

function generateSuggestions(messages) {
    const userMessages = messages.filter(msg => msg.role === "user");
    if (userMessages.length === 0) {
        return [
            "Phân tích bài thơ 'Đây thôn Vĩ Dạ' của Hàn Mặc Tử",
            "Kể tên các tác phẩm tiêu biểu của Nam Cao",
            "Giới thiệu về phong trào Thơ mới 1932-1945",
            "Phân tích nhân vật Chí Phèo trong tác phẩm cùng tên"
        ];
    }
    const lastMessage = userMessages[userMessages.length - 1].content;
    if (lastMessage.includes("phân tích")) {
        return [
            "Bạn có thể phân tích sâu hơn về nghệ thuật trong tác phẩm này không?",
            "Tác giả sử dụng những biện pháp tu từ nào?",
            "Ý nghĩa nhan đề của tác phẩm là gì?"
        ];
    } else if (lastMessage.includes("tác giả")) {
        return [
            `Các tác phẩm khác của tác giả này là gì?`,
            "Phong cách sáng tác của tác giả này",
            "Ảnh hưởng của tác giả này đến văn học Việt Nam"
        ];
    } else if (lastMessage.includes("thơ")) {
        return [
            "Phân tích hình ảnh trong bài thơ",
            "Bố cục của bài thơ này như thế nào?",
            "Hoàn cảnh sáng tác bài thơ này"
        ];
    }
    return [
        "Bạn có thể giải thích rõ hơn về điều này không?",
        "Có tác phẩm nào tương tự như vậy không?",
        "Ý nghĩa sâu xa của vấn đề này là gì?"
    ];
}

// ============================
// KHỞI TẠO API PHÒNG THỦ CHO POPUP
// ============================
async function initializeAPIDefenseForPopup() {
    try {
        console.log("🚀 Khởi tạo hệ thống API Phòng Thủ cho Popup...");
        apiDefenseSystem = new APIDefenseSystem();
        const apiInfo = await apiDefenseSystem.initialize();
        
        console.log(`✅ Hệ thống API Phòng Thủ đã sẵn sàng`);
        console.log(`📊 Đang dùng API: #${apiInfo.index} (${apiDefenseSystem.workingApis.length}/${apiDefenseSystem.allApis.length} hoạt động)`);
        
        return true;
    } catch (error) {
        console.error("❌ Lỗi khởi tạo API Phòng Thủ:", error);
        return false;
    }
}

// ============================
// GỬI TIN NHẮN VỚI API PHÒNG THỦ
// ============================
async function sendMessageWithAPIDefense(userMessage, currentChat) {
    if (!apiDefenseSystem || !apiDefenseSystem.isInitialized) {
        console.error("Hệ thống API chưa được khởi tạo!");
        return null;
    }

    try {
        // Thử tất cả API để trả lời
        const result = await apiDefenseSystem.tryAllApisForResponse(
            userMessage,
            currentChat.messages
        );

        if (result.success) {
            return result.response;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn với API phòng thủ:", error);
        
        // Thử phương pháp cũ nếu hệ thống API phòng thủ thất bại
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${CHATBOT_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: userMessage }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 2000,
                        temperature: 0.9,
                        topP: 0.1,
                        topK: 16,
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        } catch (innerError) {
            console.error("Lỗi cả với phương pháp cũ:", innerError);
            return null;
        }
    }
}

function initChatbot() {
    const popupContent = document.getElementById('popupContent');
    const popupTitle = document.getElementById('popupTitle');
    
    if (!popupContent || !popupTitle) {
        console.error('Không tìm thấy popupContent hoặc popupTitle');
        return;
    }
    
    if (popupTitle.textContent === 'Chatbot AI Văn Học') {
        popupContent.innerHTML = `
            <div class="chatbot-popup">
                <button class="sidebar-toggle-btn" id="sidebarToggleBtn">
                    <i class="fas fa-chevron-right"></i>
                </button>
                
                <div class="chat-layout">
                    <div class="chat-sidebar" id="chatSidebar">
                        <div class="sidebar-header">
                            <button id="new-chat-btn" class="new-chat-btn">
                                <i class="fas fa-file-circle-plus"></i>
                                <span>Đoạn nhắn mới</span>
                            </button>
                            <button class="close-sidebar-btn" id="closeSidebarBtn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="chat-history" id="chat-history">
                        </div>
                    </div>
                    
                    <div class="chat-main">
                        <div class="chat-container">
                            <div class="chat-messages" id="chat-messages">
                            </div>
                            
                            <div class="suggestions-bar" id="suggestions-bar">
                                <div class="suggestions-title">Gợi ý nhanh:</div>
                                <div class="suggestions-container" id="suggestions-container">
                                </div>
                            </div>
                            
                            <div class="chat-input-area">
                                <textarea 
                                    id="message-input" 
                                    class="chat-input"
                                    placeholder="Nhập câu hỏi về văn học..."
                                    rows="1"
                                ></textarea>
                                <button 
                                    id="send-button" 
                                    type="submit" 
                                    class="send-button"
                                >
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            setupChatbot();
            
            if (window.lastSelectedText) {
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.value = `"${window.lastSelectedText}" là gì?`;
                    messageInput.focus();
                    
                    messageInput.style.height = 'auto';
                    const newHeight = Math.min(messageInput.scrollHeight, 120);
                    messageInput.style.height = `${newHeight}px`;
                    
                    window.lastSelectedText = null;
                }
            }
        }, 200);
    }
}

async function setupChatbot() {
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistory = document.getElementById('chat-history');
    const suggestionsBar = document.getElementById('suggestions-bar');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const chatSidebar = document.getElementById('chatSidebar');

    if (!chatMessages || !messageInput || !sendButton || !newChatBtn || !chatHistory || 
        !suggestionsContainer || !sidebarToggleBtn || !closeSidebarBtn || !chatSidebar) {
        console.error('Một số element DOM không tìm thấy trong chatbot');
        return;
    }

    // ============================
    // KHỞI TẠO HỆ THỐNG
    // ============================
    console.log("🚀 Khởi động VANW Chatbot Popup...");
    
    // Khởi tạo API phòng thủ
    const apiInitSuccess = await initializeAPIDefenseForPopup();
    
    if (!apiInitSuccess) {
        addMessageToUI("assistant", 
            "⚠️ **Cảnh báo hệ thống:**\n\n" +
            "Hệ thống gặp sự cố khi khởi tạo API. Một số tính năng có thể bị hạn chế.\n" +
            "Vui lòng refresh trang nếu vấn đề tiếp diễn."
        );
    }

    // ============================
    // SETUP SIDEBAR
    // ============================
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);

    function toggleSidebar() {
        isSidebarVisible = !isSidebarVisible;

        if (isSidebarVisible) {
            chatSidebar.style.left = '0';

            const isMobile = window.innerWidth <= 768;
            sidebarToggleBtn.style.left = isMobile ? '300px' : '250px';

            sidebarToggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        } else {
            chatSidebar.style.left = '-300px';
            sidebarToggleBtn.style.left = '0px';
            sidebarToggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        }
    }

    window.addEventListener('resize', function() {
        if (isSidebarVisible) {
            const isMobile = window.innerWidth <= 768;
            sidebarToggleBtn.style.left = isMobile ? '300px' : '250px';
        }
    });

    // ============================
    // LOAD CHATS
    // ============================
    loadChats();

    // ============================
    // SETUP EVENT LISTENERS
    // ============================
    newChatBtn.addEventListener('click', createNewChat);
    
    sendButton.addEventListener('click', handleSubmit);
    
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.value.trim() !== '') {
                handleSubmit();
            }
        }
    });
    
    messageInput.addEventListener('input', autoResizeTextarea);

    // ============================
    // INITIALIZE FIRST CHAT
    // ============================
    if (chats.length === 0) {
        createNewChat();
        addWelcomeMessage();
    } else {
        loadChat(chats[0].id);
    }

    console.log("✅ VANW Chatbot Popup đã sẵn sàng!");

    // ============================
    // CÁC HÀM HỖ TRỢ
    // ============================
    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        const newHeight = Math.min(messageInput.scrollHeight, 120);
        messageInput.style.height = `${newHeight}px`;
    }

    async function handleSubmit() {
        const userMessage = messageInput.value.trim();
        if (!userMessage || isSending) return;

        if (!isLiteraryQuestion(userMessage)) {
            addMessageToUI("assistant", "Xin lỗi, tôi chỉ trả lời chuyên về các câu hỏi liên quan đến văn học, bạn có câu hỏi nào liên quan đến văn học mà muốn hỏi tôi không?");
            messageInput.value = "";
            autoResizeTextarea();
            return;
        }

        if (!currentChatId) {
            createNewChat();
            return;
        }

        const currentChat = chats.find(chat => chat.id === currentChatId);
        if (!currentChat) {
            console.error("Không tìm thấy cuộc trò chuyện hiện tại!");
            return;
        }

        isSending = true;
        addMessageToUI("user", userMessage);
        
        sendButton.innerHTML = '<div class="loading-spinner"></div>';
        sendButton.disabled = true;

        const greetings = ["chào", "hello", "hi", "xin chào"];
        if (greetings.some(greet => userMessage.toLowerCase().includes(greet))) {
            const greetingResponse = "Xin chào, tôi là AI văn học được tạo ra bởi Hoàng Minh Tuấn và Trương Viết Duy Chương đến từ trường THPT Thừa Lưu. Tôi có thể giúp gì cho bạn về văn học ngay bây giờ?";
            displayTypingMessage(greetingResponse, () => {
                if (!isStopped) {
                    currentChat.messages.push({ 
                        role: "assistant", 
                        content: greetingResponse,
                        timestamp: new Date().toISOString()
                    });
                    saveChats();
                    updateSuggestions(currentChat.messages);
                }
            });
            messageInput.value = "";
            autoResizeTextarea();
            isSending = false;
            resetSendButton();
            return;
        }

        currentChat.messages.push({ 
            role: "user", 
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        saveChats();
        updateChatTitle(currentChat);

        messageInput.value = "";
        autoResizeTextarea();
        isStopped = false;

        try {
            // Sử dụng hệ thống API phòng thủ để gửi tin nhắn
            let botReply;
            
            if (apiDefenseSystem && apiDefenseSystem.isInitialized) {
                botReply = await sendMessageWithAPIDefense(userMessage, currentChat);
            } else {
                // Fallback: dùng phương pháp cũ
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${CHATBOT_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: userMessage }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 2000,
                            temperature: 0.9,
                            topP: 0.1,
                            topK: 16,
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                botReply = data.candidates[0].content.parts[0].text.trim();
            }

            if (!botReply) {
                throw new Error("Không nhận được phản hồi từ AI");
            }
            
            displayTypingMessage(botReply, () => {
                if (!isStopped) {
                    currentChat.messages.push({ 
                        role: "assistant", 
                        content: botReply,
                        timestamp: new Date().toISOString()
                    });
                    saveChats();
                    updateSuggestions(currentChat.messages);
                }
            });
        } catch (error) {
            console.error("Lỗi: ", error);
            
            // Thông báo lỗi thân thiện
            let errorMessage = "Xin lỗi, đã xảy ra lỗi khi kết nối với AI. ";
            
            if (error.message.includes("quota") || error.message.includes("limit")) {
                errorMessage += "Có thể đã hết lượt truy cập API. ";
            }
            
            errorMessage += "Vui lòng thử lại sau hoặc đặt câu hỏi khác!";
            
            addMessageToUI("assistant", errorMessage);
        } finally {
            isSending = false;
            resetSendButton();
            scrollToBottom();
        }
    }

    function resetSendButton() {
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendButton.disabled = false;
    }

    function updateSuggestions(messages) {
        const suggestions = generateSuggestions(messages);
        
        if (!suggestionsContainer) {
            console.warn('suggestionsContainer không tìm thấy');
            return;
        }
        
        suggestionsContainer.innerHTML = '';
        
        if (suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                chip.textContent = suggestion;
                chip.addEventListener('click', () => {
                    if (messageInput) {
                        messageInput.value = suggestion;
                        messageInput.focus();
                        autoResizeTextarea();
                    }
                });
                suggestionsContainer.appendChild(chip);
            });
            
            if (suggestionsBar) {
                suggestionsBar.style.display = 'block';
            }
        } else {
            if (suggestionsBar) {
                suggestionsBar.style.display = 'none';
            }
        }
    }

    function displayTypingMessage(content, callback) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'typing-indicator';
        messageDiv.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <span>AI đang suy nghĩ, vui lòng đợi giây lát</span>
        `;
        
        if (chatMessages) {
            chatMessages.appendChild(messageDiv);
            scrollToBottom();
        }

        setTimeout(() => {
            messageDiv.remove();
            addMessageToUI("assistant", content);
            if (callback) callback();
        }, 1500);
    }

    function addMessageToUI(role, content) {
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const formattedContent = formatMessage(content);
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="markdown">${formattedContent}</div>
                <div class="message-time">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function formatMessage(content) {
        if (!content) return '';

        let formatted = content.replace(/```([\w]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const langDisplay = lang ? lang : 'text';
            return `<div class="code-block">
                <div class="code-header">
                    <span>${langDisplay}</span>
                    <button class="copy-code-btn" onclick="copyToClipboard(this)" data-code="${encodeURIComponent(code.trim())}">
                        <i class="fas fa-copy"></i> Copy code
                    </button>
                </div>
                <pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>
            </div>`;
        });

        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        formatted = formatted.split('\n\n').map(paragraph => {
            if (paragraph.trim().startsWith('<') && paragraph.trim().endsWith('>')) {
                return paragraph;
            }
            return `<p>${paragraph}</p>`;
        }).join('');

        formatted = formatted.replace(/\n(?![<])/g, '<br>');

        return formatted;
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function scrollToBottom() {
        if (!chatMessages) return;
        
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    function addWelcomeMessage() {
        const welcomeMessage = "Xin chào! Tôi là AI trợ lý văn học. Tôi có thể giúp bạn phân tích tác phẩm, tìm hiểu về tác giả, thể loại văn học và nhiều chủ đề khác liên quan đến văn học Việt Nam và thế giới. Hãy hỏi tôi bất cứ điều gì về văn học!";
        addMessageToUI("assistant", welcomeMessage);
        
        if (currentChatId) {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                currentChat.messages.push({
                    role: "assistant",
                    content: welcomeMessage,
                    timestamp: new Date().toISOString()
                });
                saveChats();
            }
        }
    }

    function createNewChat() {
        const newChat = {
            id: Date.now().toString(),
            title: 'Đoạn nhắn mới',
            messages: [],
            createdAt: new Date().toISOString()
        };

        chats.unshift(newChat);
        saveChats();
        renderChatHistory();
        loadChat(newChat.id);
        
        if (messageInput) {
            messageInput.focus();
        }
        
        if (suggestionsBar) {
            suggestionsBar.style.display = 'block';
        }
        
        setTimeout(addWelcomeMessage, 300);
    }

    function loadChat(chatId) {
        currentChatId = chatId;

        document.querySelectorAll('.chat-item').forEach(item => {
            if (item.dataset.id === chatId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (chatMessages) {
            chatMessages.innerHTML = '';
        }

        const currentChat = chats.find(chat => chat.id === chatId);
        if (!currentChat) return;

        if (currentChat.messages.length > 0) {
            currentChat.messages.forEach(message => {
                addMessageToUI(message.role, message.content);
            });
            updateSuggestions(currentChat.messages);
        }
        
        scrollToBottom();
    }

    function deleteChat(chatId, event) {
        if (event) event.stopPropagation();
        
        chats = chats.filter(chat => chat.id !== chatId);
        saveChats();
        renderChatHistory();

        if (chatId === currentChatId) {
            if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                createNewChat();
            }
        }
    }

    function updateChatTitle(chat) {
        if (!chat || !chat.messages || chat.messages.length === 0) {
            chat.title = "Đoạn nhắn mới";
            saveChats();
            renderChatHistory();
            return;
        }

        const firstUserMessage = chat.messages.find(msg => msg.role === "user");
        if (firstUserMessage) {
            let title = firstUserMessage.content.substring(0, 40);
            if (firstUserMessage.content.length > 40) {
                title += "...";
            }
            chat.title = title || "Đoạn nhắn mới";
        } else {
            chat.title = "Đoạn nhắn mới";
        }

        saveChats();
        renderChatHistory();
    }

    function renderChatHistory() {
        if (!chatHistory) return;

        chatHistory.innerHTML = '';

        if (chats.length === 0) {
            chatHistory.innerHTML = `
                <div style="color: var(--text-primary); opacity: 0.7; text-align: center; padding: 20px;">
                    Chưa có đoạn nhắn nào
                </div>
            `;
            return;
        }

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatItem.dataset.id = chat.id;

            const chatDate = new Date(chat.createdAt || chat.id);
            const formattedDate = chatDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            chatItem.innerHTML = `
                <div class="chat-title">${chat.title || 'Đoạn nhắn mới'}</div>
                <div class="chat-date">${formattedDate}</div>
                <button class="delete-chat-btn">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            chatItem.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-chat-btn')) {
                    loadChat(chat.id);
                }
            });

            const deleteBtn = chatItem.querySelector('.delete-chat-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    deleteChat(chat.id, e);
                });
            }

            chatHistory.appendChild(chatItem);
        });
    }

    function loadChats() {
        const storedChats = localStorage.getItem('vanw-chatbot-chats');
        if (storedChats) {
            const now = Date.now();
            const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

            chats = JSON.parse(storedChats)
                .filter(chat => now - new Date(chat.createdAt || chat.id).getTime() < THIRTY_DAYS)
                .sort((a, b) => new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id));
            
            saveChats();
            renderChatHistory();
        }
    }

    function saveChats() {
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        chats = chats.filter(chat => {
            const chatTime = new Date(chat.createdAt || chat.id).getTime();
            return now - chatTime < THIRTY_DAYS;
        });

        localStorage.setItem('vanw-chatbot-chats', JSON.stringify(chats));
    }

    window.copyToClipboard = function(button) {
        const code = decodeURIComponent(button.getAttribute('data-code'));
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Đã sao chép!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Lỗi khi sao chép:', err);
            button.innerHTML = '<i class="fas fa-times"></i> Lỗi!';
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i> Copy code';
            }, 2000);
        });
    };

    updateSuggestions([]);
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('popupTitle') && document.getElementById('popupTitle').textContent === 'Chatbot AI Văn Học') {
        setTimeout(initChatbot, 300);
    }
});


window.initChatbot = initChatbot;
