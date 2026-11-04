
// ==========================================
// RUANG SUARA MURID
// SISTEM MAKLUM BALAS DAN REFLEKSI MURID
// ==========================================


// 1. KONFIGURASI SUPABASE

const SUPABASE_URL = "MASUKKAN_PROJECT_URL";
const SUPABASE_KEY = "MASUKKAN_PUBLISHABLE_KEY";

const TABLE_NAME = "student_feedback";

const EMOJI = {
    "Sangat gembira": "😄",
    "Seronok": "🙂",
    "Biasa sahaja": "😐",
    "Masih keliru": "😕"
};


// 2. SEMAK SAMBUNGAN

const form = document.getElementById("feedbackForm");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const formMessage = document.getElementById("formMessage");

const commentsList = document.getElementById("commentsList");
const totalFeedback = document.getElementById("totalFeedback");
const refreshBtn = document.getElementById("refreshBtn");

let db = null;
let realtimeChannel = null;
let isSubmitting = false;
let isLoading = false;

const isConfigured =
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_KEY.length > 20 &&
    !SUPABASE_URL.includes("MASUKKAN") &&
    !SUPABASE_KEY.includes("MASUKKAN");

if (isConfigured && window.supabase) {

    db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

} else {

    showMessage(
        "Sila lengkapkan konfigurasi Supabase sebelum menggunakan laman ini.",
        "error"
    );

    commentsList.textContent =
        "Sistem belum disambungkan kepada pangkalan data.";

    submitBtn.disabled = true;

}


// 3. FUNGSI MESEJ

function showMessage(text, type) {

    formMessage.textContent = text;

    formMessage.className = "form-message " + type;

    formMessage.style.color =
        type === "success" ? "#419B78" : "#D46C80";

}


// 4. PILIH EMOJI PERASAAN

const emotionOptions =
    document.querySelectorAll(".emotion-option");

emotionOptions.forEach(button => {

    button.addEventListener("click", function() {

        emotionOptions.forEach(option => {

            option.classList.remove("selected");

            option.setAttribute("aria-pressed", "false");

        });

        this.classList.add("selected");

        this.setAttribute("aria-pressed", "true");

        document.getElementById("feeling").value =
            this.dataset.feeling;

    });

});


// 5. KIRA JUMLAH AKSARA

function setupCharacterCounter(inputId, counterId) {

    const input = document.getElementById(inputId);

    const counter = document.getElementById(counterId);

    input.addEventListener("input", function() {

        counter.textContent = this.value.length;

    });

}

setupCharacterCounter(
    "understood",
    "understoodCount"
);

setupCharacterCounter(
    "confused",
    "confusedCount"
);


// 6. HANTAR MAKLUM BALAS

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    if (!db || isSubmitting) return;

    const studentName = document
        .getElementById("studentName")
        .value.trim();

    const feeling = document
        .getElementById("feeling")
        .value;

    const understood = document
        .getElementById("understood")
        .value.trim();

    const confused = document
        .getElementById("confused")
        .value.trim();


    // Semakan maklumat

    if (!studentName || !feeling || !understood) {

        showMessage(
            "Sila isi nama, pilih perasaan dan lengkapkan perkara yang difahami.",
            "error"
        );

        return;

    }

    if (
        studentName.length > 30 ||
        understood.length > 500 ||
        confused.length > 500
    ) {

        showMessage(
            "Sila semak semula panjang jawapan kamu.",
            "error"
        );

        return;

    }


    isSubmitting = true;

    submitBtn.disabled = true;

    submitText.textContent = "SEDANG MENGHANTAR...";

    showMessage("", "success");


    try {

        const { error } = await db
            .from(TABLE_NAME)
            .insert([{

                student_name: studentName,

                feeling: feeling,

                understood: understood,

                confused: confused

            }]);


        if (error) throw error;


        // Berjaya dihantar

        showMessage(
            "Tahniah! Maklum balas kamu berjaya disimpan.",
            "success"
        );


        // Kosongkan borang

        form.reset();

        emotionOptions.forEach(option => {

            option.classList.remove("selected");

            option.setAttribute("aria-pressed", "false");

        });

        document.getElementById("understoodCount").textContent = "0";

        document.getElementById("confusedCount").textContent = "0";


        // Muatkan semula komen

        await loadFeedback();


        // Pergi ke bahagian komen

        document.getElementById("comments-section")
            .scrollIntoView({

                behavior: "smooth",

                block: "start"

            });


    } catch (error) {

        console.error("Ralat penghantaran:", error);

        showMessage(
            "Maaf, maklum balas tidak berjaya dihantar. Sila cuba lagi.",
            "error"
        );

    } finally {

        isSubmitting = false;

        submitBtn.disabled = false;

        submitText.textContent = "HANTAR MAKLUM BALAS";

    }

});


// 7. PAPARKAN TARIKH

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


// 8. BINA KAD KOMEN DENGAN SELAMAT

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

    feeling.textContent =
        (EMOJI[item.feeling] || "💬") + " " + item.feeling;


    header.append(name, feeling);


    // Perkara yang difahami

    const understoodTitle = document.createElement("div");

    understoodTitle.className = "comment-label";

    understoodTitle.textContent =
        "Apa yang saya faham";


    const understoodText = document.createElement("p");

    understoodText.className = "comment-text";

    understoodText.textContent = item.understood;


    // Perkara yang masih mengelirukan

    const confusedTitle = document.createElement("div");

    confusedTitle.className = "comment-label";

    confusedTitle.textContent =
        "Apa yang masih mengelirukan";


    const confusedText = document.createElement("p");

    confusedText.className = "comment-text";

    confusedText.textContent =
        item.confused || "Tiada perkara yang dinyatakan.";


    // Tarikh

    const date = document.createElement("div");

    date.className = "comment-date";

    date.textContent = "Dihantar pada: " +
        formatDate(item.created_at);


    card.append(

        header,

        understoodTitle,

        understoodText,

        confusedTitle,

        confusedText,

        date

    );

    return card;

}


// 9. MUATKAN SEMUA MAKLUM BALAS

async function loadFeedback() {

    if (!db || isLoading) return;

    isLoading = true;

    commentsList.textContent =
        "Sedang memuatkan maklum balas...";

    try {

        // Dapatkan jumlah rekod sebenar

        const { count, error: countError } = await db

            .from(TABLE_NAME)

            .select("id", {

                count: "exact",

                head: true

            });


        if (countError) throw countError;


        // Dapatkan rekod terkini

        const { data, error } = await db

            .from(TABLE_NAME)

            .select(
                "id, student_name, feeling, understood, confused, created_at"
            )

            .order("created_at", {

                ascending: false

            })

            .limit(200);


        if (error) throw error;


        // Paparkan jumlah maklum balas

        totalFeedback.textContent =
            count ?? 0;


        commentsList.replaceChildren();


        // Jika belum ada komen

        if (!data || data.length === 0) {

            const empty = document.createElement("div");

            empty.className = "empty-state";

            empty.textContent =
                "Belum ada maklum balas. Jadilah murid pertama yang berkongsi!";

            commentsList.appendChild(empty);

            return;

        }


        // Paparkan setiap komen

        data.forEach(item => {

            commentsList.appendChild(
                createCommentCard(item)
            );

        });


        if (count > data.length) {

            const notice = document.createElement("p");

            notice.className = "empty-state";

            notice.textContent =
                "Paparan ini menunjukkan 200 maklum balas terkini.";

            commentsList.appendChild(notice);

        }


    } catch (error) {

        console.error("Ralat memuatkan rekod:", error);

        commentsList.textContent =
            "Maaf, rekod tidak dapat dimuatkan. Sila cuba semula.";

    } finally {

        isLoading = false;

    }

}


// 10. BUTANG MUAT SEMULA

refreshBtn.addEventListener("click", function() {

    loadFeedback();

});


// 11. KEMAS KINI KOMEN SECARA LANGSUNG

function setupRealtime() {

    if (!db) return;

    realtimeChannel = db

        .channel("student-feedback-live")

        .on(

            "postgres_changes",

            {

                event: "*",

                schema: "public",

                table: TABLE_NAME

            },

            () => {

                loadFeedback();

            }

        )

        .subscribe(status => {

            console.log("Status Realtime:", status);

        });

}


// 12. MULAKAN SISTEM

async function startApp() {

    if (!db) return;

    await loadFeedback();

    setupRealtime();

}

startApp();
