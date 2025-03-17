pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const file_input = document.getElementById("pdf-input");
const file_label = document.querySelector("label[for='pdf-input']");
const file_link_input = document.querySelector(".file-link");
const add_file_button = document.querySelector(".add-file button");
const uploaded_files_div = document.querySelector(".uploaded-files");
const vocab_container = document.querySelector(".word-container");
const vocab_range = document.querySelector(".vocab-range");
const vocab_value = document.querySelector(".vocab-value");
const language_selector = document.getElementById("lang");
const copy_button = document.querySelector(".copy");
let word_list = [];
let dictionary = {};
let word_freq = {};

fetch("words.json")
  .then(response => response.json())
  .then(data => dictionary = data);

file_input.addEventListener("change", () => {
  if (file_input.files.length > 0) {
    file_label.textContent = "File Uploaded";
  }
});

vocab_range.addEventListener("input", () => {
  vocab_value.textContent = `Number of Highest Frequency Words: ${vocab_range.value}`;
});

add_file_button.addEventListener("click", () => {
  let file = file_input.files[0];
  let link = file_link_input.value.trim();
  if (file) {
    let reader = new FileReader();
    reader.onload = async function (event) {
      let pdf_data = new Uint8Array(event.target.result);
      let pdf = await pdfjsLib.getDocument({ data: pdf_data }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        let page = await pdf.getPage(i);
        let content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + " ";
      }
      process_text(text);
      uploaded_files_div.innerHTML += `<span>${file.name}</span>`;
      file_input.value = "";
    };
    reader.readAsArrayBuffer(file);
  }
  if (link) {
    fetch(link)
      .then(response => response.text())
      .then(text => {
        process_text(text);
        uploaded_files_div.innerHTML += `<span>${link}</span>`;
      });
  }
});

function process_text(text) {
  let words = text.toLowerCase().replace(/[^a-zA-ZÀ-ÿ\s]/g, "").split(" ");
  words.forEach(word => {
    if (word) {
      word_freq[word] = (word_freq[word] || 0) + 1;
    }
  });
  let sorted_words = Object.entries(word_freq).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
  word_list = [...new Set([...word_list, ...sorted_words])];
  refresh_vocab_list();
}

function refresh_vocab_list() {
  let selected_language = language_selector.value.toLowerCase();
  let is_english = selected_language === "english";
  let filtered_words = word_list.filter(word => is_english ? word in dictionary : !(word in dictionary));
  let total_words = filtered_words.reduce((sum, word) => sum + (word_freq[word] || 0), 0);
  filtered_words = filtered_words.slice(0, vocab_range.value);
  vocab_container.innerHTML = "";
  filtered_words.forEach((word, index) => {
    let percentage = ((word_freq[word] / total_words) * 100).toFixed(2);
    let button = document.createElement("button");
    button.innerHTML = `${index + 1}: ${word} <span style='font-size: 0.8em;'>(${percentage}%)</span>`;
    button.addEventListener("click", () => {
      word_list = word_list.filter(w => w !== word);
      refresh_vocab_list();
    });
    vocab_container.appendChild(button);
  });
}

copy_button.addEventListener("click", () => {
  let words = Array.from(vocab_container.children).map(button => button.textContent.split(" ")[1]).join("\n");
  navigator.clipboard.writeText(words).then(() => {
    alert("Vocabulary copied to clipboard!");
  });
});