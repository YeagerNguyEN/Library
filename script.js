document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const bookGrid = document.getElementById('book-grid');
    const addBookBtn = document.getElementById('add-book-btn');
    const modal = document.getElementById('add-book-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const addBookForm = document.getElementById('add-book-form');
    const bookFileInput = document.getElementById('book-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    // Reader Elements
    const readerView = document.getElementById('reader-view');
    const closeReaderBtn = document.getElementById('close-reader-btn');
    const epubViewer = document.getElementById('epub-viewer');
    const pdfViewer = document.getElementById('pdf-viewer');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    // App State
    let books = JSON.parse(localStorage.getItem('bookshelf')) || [];
    let currentBook = {
        rendition: null, // For EPUB.js
        pdfDoc: null,    // For PDF.js
        pageNum: 1,
    };

    // --- Toast Notification ---
    const showToast = (message, type = 'success') => {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // --- Book Management ---
    const saveBooks = () => {
        localStorage.setItem('bookshelf', JSON.stringify(books));
    };

    const renderBooks = () => {
        bookGrid.innerHTML = '';
        if (books.length === 0) {
            bookGrid.innerHTML = '<p class="empty-message">Thư viện của bạn trống. Hãy thêm cuốn sách đầu tiên!</p>';
            return;
        }
        books.forEach((book, index) => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.index = index;
            card.innerHTML = `
                <div class="book-icon"><i class="fas fa-book"></i></div>
                <h3 class="book-title">${book.title}</h3>
                <button class="delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            bookGrid.appendChild(card);
        });
    };

    // --- Modal Handling ---
    const toggleModal = (show) => {
        modal.style.display = show ? 'flex' : 'none';
        if (show) addBookForm.reset();
        fileNameDisplay.textContent = '';
    };

    // --- Reader Handling ---
    const openReader = (index) => {
        const book = books[index];
        readerView.style.display = 'flex';

        if (book.type === 'application/epub+zip') {
            displayEpub(book.data);
        } else if (book.type === 'application/pdf') {
            displayPdf(book.data);
        }
    };

    const closeReader = () => {
        readerView.style.display = 'none';
        epubViewer.innerHTML = '';
        currentBook.rendition = null;
        currentBook.pdfDoc = null;
    };

    const displayEpub = (data) => {
        pdfViewer.style.display = 'none';
        epubViewer.style.display = 'block';
        const book = ePub(`data:application/epub+zip;base64,${data}`);
        currentBook.rendition = book.renderTo(epubViewer, {
            width: '100%',
            height: '100%',
            flow: 'paginated',
            spread: 'auto',
        });
        currentBook.rendition.display();

        currentBook.rendition.on('relocated', (location) => {
            const current = location.start.location;
            const total = book.locations.length();
            pageInfo.textContent = `Trang ${current} / ${total}`;
            prevBtn.disabled = location.atStart;
            nextBtn.disabled = location.atEnd;
        });
    };

    const displayPdf = (data) => {
        epubViewer.style.display = 'none';
        pdfViewer.style.display = 'block';
        const pdfData = atob(data);
        pdfjsLib.getDocument({ data: pdfData }).promise.then(doc => {
            currentBook.pdfDoc = doc;
            currentBook.pageNum = 1;
            renderPdfPage(currentBook.pageNum);
        });
    };

    const renderPdfPage = (num) => {
        currentBook.pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            const context = pdfViewer.getContext('2d');
            pdfViewer.height = viewport.height;
            pdfViewer.width = viewport.width;
            page.render({ canvasContext: context, viewport });

            pageInfo.textContent = `Trang ${num} / ${currentBook.pdfDoc.numPages}`;
            prevBtn.disabled = num <= 1;
            nextBtn.disabled = num >= currentBook.pdfDoc.numPages;
        });
    };

    // --- Event Listeners ---
    addBookBtn.addEventListener('click', () => toggleModal(true));
    closeModalBtn.addEventListener('click', () => toggleModal(false));

    bookFileInput.addEventListener('change', () => {
        fileNameDisplay.textContent = bookFileInput.files.length > 0 ? bookFileInput.files[0].name : '';
    });

    addBookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('book-title-input').value;
        const file = bookFileInput.files[0];

        if (title && file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target.result.split(',')[1];
                books.push({ title, data, type: file.type });
                saveBooks();
                renderBooks();
                toggleModal(false);
                showToast('Đã thêm sách thành công!');
            };
            reader.readAsDataURL(file);
        }
    });

    bookGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.book-card');
        if (!card) return;

        const index = card.dataset.index;
        if (e.target.closest('.delete-btn')) {
            if (confirm(`Bạn có chắc muốn xóa sách "${books[index].title}"?`)) {
                books.splice(index, 1);
                saveBooks();
                renderBooks();
                showToast('Đã xóa sách.', 'error');
            }
        } else {
            openReader(index);
        }
    });

    closeReaderBtn.addEventListener('click', closeReader);

    prevBtn.addEventListener('click', () => {
        if (currentBook.rendition) currentBook.rendition.prev();
        if (currentBook.pdfDoc && currentBook.pageNum > 1) {
            currentBook.pageNum--;
            renderPdfPage(currentBook.pageNum);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentBook.rendition) currentBook.rendition.next();
        if (currentBook.pdfDoc && currentBook.pageNum < currentBook.pdfDoc.numPages) {
            currentBook.pageNum++;
            renderPdfPage(currentBook.pageNum);
        }
    });
    
    // --- Initial Load ---
    renderBooks();
});