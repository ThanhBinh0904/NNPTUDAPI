// State management
let allProducts = [];
let currentProduct = null;
let currentPage = 1;
let itemsPerPage = 5;
let searchTerm = '';
let sortType = 'none'; // none, price-asc, price-desc, title-asc, title-desc

LoadData();

async function LoadData() {
    try {
        let res = await fetch('http://localhost:3000/products');
        allProducts = await res.json();
        currentPage = 1;
        renderProducts();
    } catch (error) {
        console.log(error);
    }
}

function getFilteredProducts() {
    let filtered = allProducts;
    
    // Filter by search term
    if (searchTerm.trim()) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // Sort
    if (sortType === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortType === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortType === 'title-asc') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortType === 'title-desc') {
        filtered.sort((a, b) => b.title.localeCompare(a.title));
    }
    
    return filtered;
}

function getPaginatedProducts() {
    const filtered = getFilteredProducts();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
        products: filtered.slice(startIndex, endIndex),
        totalPages: totalPages,
        totalItems: filtered.length
    };
}

function renderProducts() {
    const { products, totalPages, totalItems } = getPaginatedProducts();
    const body = document.getElementById('post-body');
    
    if (products.length === 0) {
        body.innerHTML = '<p class="col-12 text-center">No products found</p>';
    } else {
        body.innerHTML = products.map(product => convertDataToHTML(product)).join('');
    }
    
    // Update pagination info
    document.getElementById('pagination-info').textContent = 
        `Showing ${products.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - ${(currentPage - 1) * itemsPerPage + products.length} of ${totalItems} products`;
    
    renderPaginationButtons(totalPages);
}

function renderPaginationButtons(totalPages) {
    const paginationDiv = document.getElementById('pagination-buttons');
    paginationDiv.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-sm btn-outline-primary';
    prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i> Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            document.querySelector('.product-grid').scrollIntoView({ behavior: 'smooth' });
        }
    };
    paginationDiv.appendChild(prevBtn);
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'btn btn-sm btn-outline-primary';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => { currentPage = 1; renderProducts(); };
        paginationDiv.appendChild(firstBtn);
        
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.className = 'px-2';
            dots.textContent = '...';
            paginationDiv.appendChild(dots);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}`;
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; renderProducts(); };
        paginationDiv.appendChild(btn);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.className = 'px-2';
            dots.textContent = '...';
            paginationDiv.appendChild(dots);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'btn btn-sm btn-outline-primary';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => { currentPage = totalPages; renderProducts(); };
        paginationDiv.appendChild(lastBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-sm btn-outline-primary';
    nextBtn.innerHTML = 'Next <i class="bi bi-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            document.querySelector('.product-grid').scrollIntoView({ behavior: 'smooth' });
        }
    };
    paginationDiv.appendChild(nextBtn);
}

function onSearchChange(value) {
    searchTerm = value;
    currentPage = 1;
    renderProducts();
}

function onItemsPerPageChange(value) {
    itemsPerPage = parseInt(value);
    currentPage = 1;
    renderProducts();
}

function onSortChange(type) {
    sortType = type;
    currentPage = 1;
    renderProducts();
}

function convertDataToHTML(product) {
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x250?text=No+Image';
    const categoryName = product.category ? product.category.name : 'Uncategorized';
    const imagesHtml = product.images && product.images.length > 1 
        ? `<div class="image-gallery">${product.images.slice(0, 3).map(img => `<img src="${img}" alt="${product.title}" class="thumbnail" onclick="showImageGallery('${product.title}', '${JSON.stringify(product.images).replace(/'/g, "\\'")}')">`).join('')}</div>`
        : '';
    
    return `
        <div class="product-card">
            <img referrerpolicy="no-referrer" src="${mainImage}" alt="${product.title}" class="product-image" onclick="showImageGallery('${product.title}', '${JSON.stringify(product.images).replace(/'/g, "\\'")}')", style="cursor: pointer;">
            <div class="product-body">
                <div class="product-category">${categoryName}</div>
                <h5 class="product-title">${product.title}</h5>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-description">${product.description}</p>
                ${imagesHtml}
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-sm btn-warning btn-action" onclick="editProduct(${product.id})"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="Delete(${product.id})"><i class="bi bi-trash"></i> Delete</button>
                </div>
            </div>
        </div>
    `;
}

function showImageGallery(title, imagesJson) {
    const images = JSON.parse(imagesJson);
    const carouselContent = document.getElementById('carouselContent');
    carouselContent.innerHTML = images.map((img, index) => 
        `<div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" alt="${title}">
        </div>`
    ).join('');
    document.getElementById('modalTitle').textContent = title;
    new bootstrap.Modal(document.getElementById('imageModal')).show();
}

async function saveData(event) {
    event.preventDefault();
    
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let price = document.getElementById('price_txt').value;
    let categoryName = document.getElementById('category_txt').value;
    let description = document.getElementById('description_txt').value;
    let images_txt = document.getElementById('images_txt').value;
    
    // Parse images from textarea (one URL per line)
    const images = images_txt
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    // Prepare category - use current product's category if editing, otherwise create new
    let categoryData = currentProduct?.category || {
        id: 1,
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        image: "https://i.imgur.com/QkIa5tT.jpeg"
    };
    
    // Update category name if changed
    if (categoryName !== categoryData.name) {
        categoryData.name = categoryName;
        categoryData.slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    }
    
    const productData = {
        title: title,
        price: parseFloat(price),
        category: categoryData,
        description: description,
        images: images.length > 0 ? images : ['https://via.placeholder.com/300x250?text=No+Image']
    };
    
    try {
        let resGET = await fetch('http://localhost:3000/products/' + id);
        
        if (resGET.ok) {
            // Update existing product
            let resPUT = await fetch('http://localhost:3000/products/' + id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            if (resPUT.ok) {
                alert('Product updated successfully!');
                currentProduct = null;
                clearForm();
                LoadData();
            }
        } else {
            // Create new product
            let resPOST = await fetch('http://localhost:3000/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: parseInt(id),
                    ...productData
                })
            });
            
            if (resPOST.ok) {
                alert('Product created successfully!');
                currentProduct = null;
                clearForm();
                LoadData();
            }
        }
    } catch (error) {
        console.log(error);
        alert('Error: ' + error.message);
    }
}

function clearForm() {
    document.getElementById('productForm').reset();
    document.getElementById('id_txt').disabled = false;
    document.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-save"></i> Save Product';
    currentProduct = null;
    document.getElementById('id_txt').focus();
}

async function editProduct(id) {
    try {
        let res = await fetch('http://localhost:3000/products/' + id);
        if (res.ok) {
            let product = await res.json();
            currentProduct = product;
            document.getElementById('id_txt').value = product.id;
            document.getElementById('title_txt').value = product.title;
            document.getElementById('price_txt').value = product.price;
            document.getElementById('category_txt').value = product.category.name || product.category;
            document.getElementById('description_txt').value = product.description;
            const imageUrls = (product.images && product.images.length > 0) ? product.images.join('\n') : '';
            document.getElementById('images_txt').value = imageUrls;
            document.getElementById('id_txt').disabled = true;
            document.querySelector('button[type="submit"]').innerHTML = '<i class="bi bi-pencil"></i> Update Product';
            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Product not found');
        }
    } catch (error) {
        console.log(error);
        alert('Error loading product data');
    }
}

async function Delete(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            let res = await fetch('http://localhost:3000/products/' + id, {
                method: "DELETE"
            });
            if (res.ok) {
                alert('Product deleted successfully!');
                LoadData();
            }
        } catch (error) {
            console.log(error);
            alert('Error deleting product');
        }
    }
}