document.addEventListener("DOMContentLoaded", () => {
    const file_input = document.getElementById("pdf-input");
    const file_label = document.querySelector("label[for='pdf-input']");
    const add_file_button = document.querySelector(".add-file button");
    const file_link_input = document.querySelector(".file-link");
    const vocab_container = document.querySelector(".word-container");
    const uploaded_files_container = document.querySelector(".uploaded-files");
    const vocab_range = document.querySelector(".vocab-range");
    const vocab_value_display = document.querySelector(".vocab-value");

    let all_words = {}; // Stores combined word counts from all uploads

    // Display initial vocab range value
    vocab_value_display.textContent = vocab_range.value;

    // Update range value display in real time
    vocab_range.addEventListener("input", () => {
        vocab_value_display.textContent = vocab_range.value;
    });

    // Handle file selection
    file_input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            file_label.textContent = "File Uploaded";
        } else {
            alert("Please upload a valid PDF file.");
            file_input.value = "";
        }
    });

    // Handle file or link parsing
    add_file_button.addEventListener("click", async () => {
        let text_content = "";
        let uploaded_item = "";

        // Check if a file is uploaded
        if (file_input.files.length > 0) {
            const file = file_input.files[0];
            text_content = await extract_text_from_pdf(file);
            uploaded_item = file.name;

            // Reset file input after processing
            file_input.value = "";
            file_label.textContent = "Upload File";
        }
        // Check if a link is provided
        else if (file_link_input.value.trim() !== "") {
            text_content = await fetch_text_from_url(file_link_input.value.trim());
            uploaded_item = file_link_input.value.trim();

            // Clear the link input field after processing
            file_link_input.value = "";
        } else {
            alert("Please upload a PDF or enter a link.");
            return;
        }

        // Update uploaded files list
        if (uploaded_item) {
            add_uploaded_file(uploaded_item);
        }

        // Process extracted text and update vocabulary list
        if (text_content) {
            update_word_count(text_content);
            refresh_vocab_list(); // Refresh vocab list with selected word count
        }
    });

    // Function to extract text from a PDF
    async function extract_text_from_pdf(file) {
        const file_reader = new FileReader();
        return new Promise((resolve, reject) => {
            file_reader.onload = async function () {
                const typed_array = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument({ data: typed_array }).promise;
                let extracted_text = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text_content = await page.getTextContent();
                    const page_text = text_content.items.map(item => item.str).join(" ");
                    extracted_text += " " + page_text;
                }
                resolve(extracted_text);
            };
            file_reader.onerror = reject;
            file_reader.readAsArrayBuffer(file);
        });
    }

    // Function to fetch text from a URL
    async function fetch_text_from_url(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch document.");
            const text = await response.text();
            return text.replace(/[^a-zA-Z ]/g, " "); // Remove special characters
        } catch (error) {
            alert("Error fetching document.");
            return "";
        }
    }

    // Function to update global word count dictionary
    function update_word_count(text) {
        const words = text.toLowerCase().split(/\s+/);
        
        words.forEach(word => {
            if (word.length > 3) {
                all_words[word] = (all_words[word] || 0) + 1;
            }
        });
    }

    // Function to refresh the vocab list based on range input
    function refresh_vocab_list() {
        const word_limit = parseInt(vocab_range.value, 10); // Get value from range input

        // Clear the vocab container before adding new words
        vocab_container.innerHTML = "";

        let sorted_words = Object.entries(all_words)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .slice(0, word_limit); // Get top words based on range input

        sorted_words.forEach((entry, index) => {
            create_word_button(entry[0], index + 1);
        });
    }

    // Function to create a word button with correct rank
    function create_word_button(word, rank) {
        const word_button = document.createElement("button");
        word_button.textContent = `${rank}: ${word}`;
        word_button.classList.add("word-button");

        // Remove word on click and update ranks
        word_button.addEventListener("click", () => {
            word_button.remove();
            update_word_ranks();
        });

        vocab_container.appendChild(word_button);
    }

    // Function to update the rank of each word after deletion
    function update_word_ranks() {
        const word_buttons = Array.from(vocab_container.children);
        word_buttons.forEach((button, index) => {
            const word = button.textContent.split(": ")[1]; // Extract word
            button.textContent = `${index + 1}: ${word}`; // Update rank
        });
    }

    // Function to add uploaded file or link to the uploaded files list
    function add_uploaded_file(item) {
        const new_file_entry = document.createElement("span");

        // Check if it's a link or a file
        if (item.startsWith("http")) {
            const link_element = document.createElement("a");
            link_element.href = item;
            link_element.textContent = item;
            link_element.target = "_blank";
            new_file_entry.appendChild(link_element);
        } else {
            new_file_entry.textContent = item;
        }

        uploaded_files_container.appendChild(new_file_entry);
    }
});
