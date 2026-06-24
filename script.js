// DOM Elements
const createBtn = document.getElementById('createBtn');
const popup = document.getElementById('popup');
const publishBtn = document.getElementById('publishBtn');
const blogContainer = document.getElementById('blogContainer');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const counter = document.getElementById('counter');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const hamburger = document.getElementById('hamburger');
const navButtons = document.getElementById('navButtons');
const closePopup = document.getElementById('closePopup');
const cancelBtn = document.getElementById('cancelBtn');
const emptyState = document.getElementById('emptyState');
// Removed: const createFirstBtn = document.getElementById('createFirstBtn');

let blogCount = 0;

// Show popup when Create button is clicked (navbar button only)
createBtn.addEventListener('click', () => {
  popup.style.display = 'flex';
  titleInput.focus();
  // Close hamburger menu if open
  closeHamburgerMenu();
});

// Removed: createFirstBtn event listener since the button was removed

// Close popup with close button
closePopup.addEventListener('click', () => {
  popup.style.display = 'none';
  resetForm();
});

// Close popup with cancel button
cancelBtn.addEventListener('click', () => {
  popup.style.display = 'none';
  resetForm();
});

// Close popup when clicking outside
popup.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.style.display = 'none';
    resetForm();
  }
});

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popup.style.display === 'flex') {
    popup.style.display = 'none';
    resetForm();
  }
});

// Reset form function
function resetForm() {
  titleInput.value = '';
  contentInput.value = '';
}

// Publish blog on Publish button click
publishBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (title && content) {
    try {
      // Send data to backend
      const res = await fetch('/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });

      const data = await res.json();

      if (res.ok) {
        // Add post to DOM
        addPostToDOM(data.post.title, data.post.content, data.post.created_at);
        resetForm();
        popup.style.display = 'none';
        
        // Hide empty state
        if (emptyState.style.display !== 'none') {
          emptyState.style.display = 'none';
        }
        
        showAlert('Blog post published successfully!', 'success');
      } else {
        showAlert(data.message || 'Error creating post', 'error');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showAlert('Server error. Please try again.', 'error');
    }
  } else {
    showAlert('Please fill out both fields.', 'warning');
  }
});

// Fetch posts from backend on page load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/posts');
    const posts = await res.json();
    blogCount = 0;
    
    if (posts.length > 0) {
      emptyState.style.display = 'none';
      posts.forEach(post => {
        addPostToDOM(post.title, post.content, post.created_at);
      });
    } else {
      emptyState.style.display = 'block';
    }
  } catch (err) {
    console.error('Error fetching posts:', err);
    emptyState.style.display = 'block';
  }
});

// Helper to add post to DOM
function addPostToDOM(title, content, createdAt) {
  const post = document.createElement('div');
  post.classList.add('blog-post');

  const formattedDate = new Date(createdAt).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  post.innerHTML = `
    <h3>${title}</h3>
    <p>${content}</p>
    <small><i class="far fa-clock"></i> ${formattedDate}</small>
    <div class="post-actions">
      <button class="edit">
        <i class="fas fa-edit"></i>
        Edit
      </button>
      <button class="delete">
        <i class="fas fa-trash-alt"></i>
        Delete
      </button>
    </div>
  `;

  blogContainer.appendChild(post);
  blogCount++;
  updateCounter();

  // Edit post
  post.querySelector('.edit').addEventListener('click', () => {
    titleInput.value = title;
    contentInput.value = content;
    popup.style.display = 'flex';
    post.remove();
    blogCount--;
    updateCounter();
  });

  // Delete post
  post.querySelector('.delete').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      post.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        post.remove();
        blogCount--;
        updateCounter();
        
        // Show empty state if no posts
        if (blogCount === 0) {
          emptyState.style.display = 'block';
        }
        
        showAlert('Blog post deleted.', 'info');
      }, 300);
    }
  });
}

// Delete all blogs
deleteAllBtn.addEventListener('click', async () => {
  if (blogCount === 0) {
    showAlert('No blogs to delete.', 'info');
    return;
  }
  
  if (confirm('Are you sure you want to delete ALL blog posts? This action cannot be undone.')) {
    try {
      const res = await fetch('/delete-all', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        // Fade out all posts
        const posts = document.querySelectorAll('.blog-post');
        posts.forEach(post => {
          post.style.animation = 'fadeOut 0.5s ease';
        });
        
        setTimeout(() => {
          blogContainer.innerHTML = '';
          blogCount = 0;
          updateCounter();
          emptyState.style.display = 'block';
          showAlert('All blog posts have been deleted.', 'success');
        }, 500);
      } else {
        showAlert(data.message || 'Failed to delete all posts', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server error. Please try again.', 'error');
    }
  }
});

// Update blog counter display
function updateCounter() {
  const counterSpan = counter.querySelector('span');
  if (counterSpan) {
    counterSpan.textContent = blogCount;
  } else {
    counter.innerHTML = `Total Blogs: <span>${blogCount}</span>`;
  }
}

// Toggle nav menu (mobile) - FIXED
hamburger.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent event bubbling
  navButtons.classList.toggle('show');
  hamburger.classList.toggle('active');
});

// Close hamburger menu function
function closeHamburgerMenu() {
  navButtons.classList.remove('show');
  hamburger.classList.remove('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  // Check if click is outside hamburger and nav buttons
  if (!hamburger.contains(e.target) && !navButtons.contains(e.target)) {
    closeHamburgerMenu();
  }
});

// Close mobile menu when clicking on a nav button inside
navButtons.addEventListener('click', (e) => {
  // If a button is clicked, close the menu after a short delay
  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
    setTimeout(closeHamburgerMenu, 300);
  }
});

// Close mobile menu on window resize (if resized to larger screen)
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    closeHamburgerMenu();
  }
});

// Alert function
function showAlert(message, type) {
  // Remove existing alert
  const existingAlert = document.querySelector('.custom-alert');
  if (existingAlert) existingAlert.remove();
  
  // Create alert
  const alert = document.createElement('div');
  alert.className = `custom-alert ${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <button class="alert-close"><i class="fas fa-times"></i></button>
  `;
  
  document.body.appendChild(alert);
  
  // Show alert
  setTimeout(() => alert.classList.add('show'), 10);
  
  // Close alert on button click
  alert.querySelector('.alert-close').addEventListener('click', () => {
    alert.classList.remove('show');
    setTimeout(() => alert.remove(), 300);
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }
  }, 5000);
}

// Add CSS for alerts
const alertStyles = document.createElement('style');
alertStyles.textContent = `
  .custom-alert {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    max-width: 350px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    transform: translateX(120%);
    transition: transform 0.3s ease;
    z-index: 3000;
  }
  
  .custom-alert.show {
    transform: translateX(0);
  }
  
  .custom-alert.error {
    background: linear-gradient(to right, #f72585, #ff4b2b);
    border-left: 5px solid #ff4b2b;
  }
  
  .custom-alert.success {
    background: linear-gradient(to right, #00b09b, #96c93d);
    border-left: 5px solid #96c93d;
  }
  
  .custom-alert.warning {
    background: linear-gradient(to right, #f8961e, #f9c74f);
    border-left: 5px solid #f9c74f;
  }
  
  .custom-alert.info {
    background: linear-gradient(to right, #4361ee, #4cc9f0);
    border-left: 5px solid #4cc9f0;
  }
  
  .alert-close {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;
document.head.appendChild(alertStyles);

// Initialize counter on load
updateCounter();