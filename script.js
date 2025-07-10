document.addEventListener("DOMContentLoaded", () => {
  const bookGrid = document.getElementById("book-grid");
  const addBookBtn = document.getElementById("add-book-btn");
  const modal = document.getElementById("add-book-modal");
  const closeModalBtn = document.querySelector(".close-btn");
  const addBookForm = document.getElementById("add-book-form");
  const bookTitleInput = document.getElementById("book-title-input");
  const bookFileInput = document.getElementById("book-file-input");
  const fileNameDisplay = document.getElementById("file-name-display");

  let books = JSON.parse(localStorage.getItem("books")) || [];

  // Hiển thị sách khi tải trang
  const renderBooks = () => {
    bookGrid.innerHTML = "";
    if (books.length === 0) {
      bookGrid.innerHTML =
        '<p style="grid-column: 1 / -1; text-align: center; color: #888;">Chưa có sách nào. Hãy thêm sách đầu tiên của bạn!</p>';
      return;
    }
    books.forEach((book, index) => {
      const bookElement = document.createElement("div");
      bookElement.classList.add("book-item");
      bookElement.innerHTML = `
                <i class="fas fa-book-open"></i>
                <h3 class="book-title">${book.title}</h3>
                <button class="delete-book-btn" data-index="${index}">&times;</button>
            `;

      // Mở sách khi click
      bookElement.addEventListener("click", (e) => {
        if (!e.target.classList.contains("delete-book-btn")) {
          const fileURL = book.fileData;
          window.open(fileURL, "_blank");
        }
      });

      // Xóa sách
      bookElement
        .querySelector(".delete-book-btn")
        .addEventListener("click", (e) => {
          e.stopPropagation(); // Ngăn sự kiện click lan ra phần tử cha
          const bookIndex = e.target.getAttribute("data-index");
          deleteBook(bookIndex);
        });

      bookGrid.appendChild(bookElement);
    });
  };

  // Lưu sách vào localStorage
  const saveBooks = () => {
    localStorage.setItem("books", JSON.stringify(books));
  };

  // Xóa sách
  const deleteBook = (index) => {
    if (confirm(`Bạn có chắc muốn xóa sách "${books[index].title}"?`)) {
      books.splice(index, 1);
      saveBooks();
      renderBooks();
    }
  };

  // Mở/đóng modal
  addBookBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Cập nhật tên tệp khi người dùng chọn
  bookFileInput.addEventListener("change", () => {
    if (bookFileInput.files.length > 0) {
      fileNameDisplay.textContent = bookFileInput.files[0].name;
    } else {
      fileNameDisplay.textContent = "Chưa có tệp nào được chọn";
    }
  });

  // Xử lý form thêm sách
  addBookForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = bookTitleInput.value;
    const file = bookFileInput.files[0];

    if (title && file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const newBook = {
          title: title,
          fileData: event.target.result, // Lưu dữ liệu file dưới dạng Base64
        };
        books.push(newBook);
        saveBooks();
        renderBooks();

        // Reset form và đóng modal
        addBookForm.reset();
        fileNameDisplay.textContent = "Chưa có tệp nào được chọn";
        modal.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });

  // Bắt đầu
  renderBooks();
});
