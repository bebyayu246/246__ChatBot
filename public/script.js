const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Menyimpan riwayat percakapan agar AI ingat konteks obrolan
let messageHistory = [
    { role: "system", content: "Kamu adalah asisten AI yang ramah, membantu, dan aesthetic bernuansa pink. Gunakan bahasa Indonesia." }
];

// Fungsi untuk menambahkan gelembung pesan ke layar
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return contentDiv; // Mengembalikan elemen agar teks bisa di-update secara real-time
}

// Fungsi utama untuk mengirim pesan ke backend dan menangani stream
async function sendMessageToAI(userText) {
    // Masukkan pesan user ke dalam riwayat
    messageHistory.push({ role: "user", content: userText });

    // Buat kotak pesan kosong untuk bot (tempat teks mengetik muncul)
    const botBubble = addMessage("", 'bot');
    let fullResponse = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messageHistory })
        });

        if (!response.ok) {
            const errData = await response.json();
            botBubble.textContent = "Maaf, terjadi kesalahan: " + (errData.error || "Gagal memproses pesan.");
            return;
        }

        // Membaca data stream (Server-Sent Events) dari server
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop(); // Simpan sisa buffer yang belum utuh

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data:")) continue;

                const dataStr = trimmed.slice(5).trim();
                if (dataStr === "[DONE]") continue;

                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed) {
                        fullResponse += parsed;
                        botBubble.textContent = fullResponse;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch (e) {
                    // Abaikan jika potongan JSON belum lengkap
                }
            }
        }

        // Masukkan balasan penuh AI ke riwayat
        messageHistory.push({ role: "assistant", content: fullResponse });

    } catch (error) {
        console.error("Error:", error);
        botBubble.textContent = "Waduh, gagal terhubung ke server. Pastikan server sudah berjalan ya! 🌸";
    }
}

// Fungsi saat tombol kirim diklik atau tekan Enter
function handleSendMessage() {
    const text = userInput.value.trim();
    if (text === '') return;

    addMessage(text, 'user');
    userInput.value = '';

    sendMessageToAI(text);
}

// Event Listeners
sendBtn.addEventListener('click', handleSendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});