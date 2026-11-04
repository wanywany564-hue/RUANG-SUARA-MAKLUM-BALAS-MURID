// ==========================================
// RUANG SUARA MURID (VERSI LOCALSTORAGE)
// TANPA PERLU SUPABASE / PANGKALAN DATA
// ==========================================

const form = document.getElementById("feedbackForm");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const formMessage = document.getElementById("formMessage");

const commentsList = document.getElementById("commentsList");
const totalFeedback = document.getElementById("totalFeedback");
const refreshBtn = document.getElementById("refreshBtn");

const EMOJI = {
    "Sangat gembira": "😄",
    "Seronok": "🙂",
    "Biasa sahaja": "😐",
    "Masih keliru": "😕"
};

// Muatkan rekod apabila laman dibuka
document.addEventListener("DOMContentLoaded", function() {
    loadFeedback();
});


// 1. PILIH EMOJI PERASAAN
const emotionOptions = document.querySelectorAll(".emotion-option");

emotionOptions.forEach(button => {
    button.addEventListener("click", function() {
        emotionOptions.forEach(option => {
            option.classList.remove("selected");
            option.setAttribute("aria-pressed", "false");
        });
        this.classList.add("selected");
        this.setAttribute("aria-pressed", "true");
        document.getElementById("feeling").value = this.dataset.feeling;
    });
});


// 2. KIRA JUMLAH AKSARA
function setupCharacterCounter(inputId, counterId) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    input.addEventListener("input", function() {
        counter.textContent = this.value.length;
    });
}

setupCharacterCounter("understood", "understoodCount");
setupCharacterCounter("confused", "confusedCount");


// 3. HANTAR MAKLUM BALAS
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const studentName = document.getElementById("studentName").value.trim();
    const feeling = document.getElementById("feeling").value;
    const understood = document.getElementById("understood").value.trim();
    const confused = document.getElementById("confused").value.trim();

    if (!studentName || !feeling || !understood) {
        showMessage("Sila isi nama, pilih perasaan dan lengkapkan perkara yang difahami.", "error");
        return;
    }

    if (studentName.length > 30 || understood.length > 500 || confused.length > 500) {
        showMessage("Sila semak semula panjang jawapan kamu.", "error");
        return;
    }

    submitBtn.disabled = true;
    submitText.textContent = "SEDANG MENGHANTAR...";

    // Ambil data sedia ada dari LocalStorage
    let senarai = JSON.parse(localStorage.getItem("student_feedback_local")) || [];

    // Cipta rekod baharu bersama tarikh semasa
    const rekodBaru = {
        student_name: studentName,
        feeling: feeling,
        understood: understood,
        confused: confused,
        created_at: new Date().toISOString()
    };

    // Masukkan ke dalam senarai (paling atas)
    senarai.unshift(rekodBaru);

    // Simpan semula ke LocalStorage
    localStorage.setItem("student_feedback_local", JSON.stringify(senarai));

    showMessage("Tahniah! Maklum balas kamu berjaya disimpan.", "success");

    // Kosongkan borang
    form.reset();
    emotionOptions.forEach(option => {
        option.classList.remove("selected");
        option.setAttribute("aria-pressed", "false");
    });
    document.getElementById("feeling").value = "";
    document.getElementById("understoodCount").textContent = "0";
    document.getElementById("confusedCount").textContent = "0";

    // Muatkan semula senarai paparan
    loadFeedback();

    submitBtn.disabled = false;
    submitText.textContent = "HANTAR MAKLUM BALAS";

    // Pergi ke bahagian komen
    document.getElementById("comments-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


// 4. Mesej Status
function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message " + type;
    formMessage.style.color = type === "success" ? "#419B78" : "#D46C80";
}


// 5. Format Tarikh
function formatDate(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return "Tarikh tidak tersedia";
    }
    return date.toLocaleString("ms-MY", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kuala_Lumpur"
    });
}


// 6. Bina Kad Komen
function createCommentCard(item) {
    const card = document.createElement("article");
    card.className = "comment-card";

    const header = document.createElement("div");
    header.className = "comment-header";

    const name = document.createElement("div");
    name.className = "comment-name";
    name.textContent = item.student_name;

    const feeling = document.createElement("div");
    feeling.className = "comment-feeling";
    feeling.textContent = (EMOJI[item.feeling] || "💬") + " " + item.feeling;

    header.append(name, feeling);

    const understoodTitle = document.createElement("div");
    understoodTitle.className = "comment-label";
    understoodTitle.textContent = "Apa yang saya faham";

    const understoodText = document.createElement("p");
    understoodText.className = "comment-text";
    understoodText.textContent = item.understood;

    const confusedTitle = document.createElement("div");
    confusedTitle.className = "comment-label";
    confusedTitle.textContent = "Apa yang masih mengelirukan";

    const confusedText = document.createElement("p");
    confusedText.className = "comment-text";
    confusedText.textContent = item.confused || "Tiada perkara yang dinyatakan.";

    const date = document.createElement("div");
    date.className = "comment-date";
    date.textContent = "Dihantar pada: " + formatDate(item.created_at);

    card.append(header, understoodTitle, understoodText, confusedTitle, confusedText, date);
    return card;
}


// 7. Muatkan Semula Paparan Maklum Balas
function loadFeedback() {
    const senarai = JSON.parse(localStorage.getItem("student_feedback_local")) || [];

    totalFeedback.textContent = senarai.length;
    commentsList.replaceChildren();

    if (senarai.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Belum ada maklum balas. Jadilah murid pertama yang berkongsi!";
        commentsList.appendChild(empty);
        return;
    }

    senarai.forEach(item => {
        commentsList.appendChild(createCommentCard(item));
    });
}


// 8. Butang Muat Semula
refreshBtn.addEventListener("click", function() {
    loadFeedback();
});
