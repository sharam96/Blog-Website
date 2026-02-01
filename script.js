document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements (using your variable names)
  const createBtn = document.getElementById('createBtn');
  const popup = document.getElementById('popup');
  const publishBtn = document.getElementById('publishBtn');
  const blogContainer = document.getElementById('blogContainer');
  const titleInput = document.getElementById('titleInput');
  const contentInput = document.getElementById('contentInput');
  const counter = document.getElementById('counter');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const hamburger = document.querySelector('.hamburger');
  const navButtons = document.querySelector('.nav-buttons');
  const closePopupBtn = document.getElementById('closePopup');

  let blogCount = 0;
  let editMode = false;
  let currentEditPost = null;

  // Initialize
  fetchPosts();

  // Event Listeners
  createBtn.addEventListener('click', () => {
    popup.classList.add('active');
    titleInput.focus();
  });

  closePopupBtn.addEventListener('click', () => {
    popup.classList.remove('active');
    resetForm();
  });

  // Close popup when clicking outside
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.classList.remove('active');
      resetForm();
    }
  });

  // Close popup with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) {
      popup.classList.remove('active');
      resetForm();
    }
  });

  // Publish blog on Publish button click
  publishBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (title && content) {
      try {
        // Show loading state
        const originalText = publishBtn.innerHTML;
        publishBtn.innerHTML = '<div class="loading"></div> Publishing...';
        publishBtn.disabled = true;

        if (editMode && currentEditPost) {
          // Update existing post (you can add your API call here)
          await updatePostInBackend(currentEditPost.id, title, content);
          
          // Update in DOM
          const postElement = document.querySelector(`[data-id="${currentEditPost.id}"]`);
          if (postElement) {
            postElement.querySelector('h3').textContent = title;
            postElement.querySelector('p').textContent = content;
            postElement.querySelector('.post-meta').innerHTML = `
              <i class="far fa-calendar"></i>
              <span>Updated: ${new Date().toLocaleString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}</span>
            `;
          }
          
          showToast('Post updated successfully!', 'success');
        } else {
          // Send data to backend
          const res = await fetch('/create-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
          });

          const data = await res.json();

          if (res.ok) {
            // Add post to DOM
            addPostToDOM(data.post.title, data.post.content, data.post.created_at, data.post.id);
            showToast('Post published successfully!', 'success');
          } else {
            showToast(data.message || 'Error creating post', 'error');
            return;
          }
        }

        // Reset form and close popup
        titleInput.value = '';
        contentInput.value = '';
        popup.classList.remove('active');
        resetForm();

      } catch (err) {
        console.error('Fetch error:', err);
        showToast('Server error', 'error');
      } finally {
        // Reset button state
        publishBtn.innerHTML = editMode ? 
          '<i class="fas fa-save"></i> Update Post' : 
          '<i class="fas fa-paper-plane"></i> Publish Post';
        publishBtn.disabled = false;
      }
    } else {
      showToast('Please fill in both title and content!', 'error');
    }
  });

  // Fetch posts from backend on page load
  async function fetchPosts() {
    try {
      const res = await fetch('/posts');
      const posts = await res.json();
      blogCount = 0;
      blogContainer.innerHTML = '';
      
      if (posts.length === 0) {
        showEmptyState();
        return;
      }
      
      posts.forEach(post => {
        addPostToDOM(post.title, post.content, post.created_at, post.id);
      });
    } catch (err) {
      console.error('Error fetching posts:', err);
      showToast('Failed to load posts', 'error');
      showEmptyState();
    }
  }

  // Helper to add post to DOM
  function addPostToDOM(title, content, createdAt, id = null) {
    const postId = id || Date.now().toString();
    
    const formattedDate = new Date(createdAt).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const post = document.createElement('div');
    post.classList.add('blog-post');
    post.setAttribute('data-id', postId);

    post.innerHTML = `
      <h3>${title}</h3>
      <div class="post-meta">
        <i class="far fa-calendar"></i>
        <span>${formattedDate}</span>
      </div>
      <p>${content}</p>
      <div class="post-actions">
        <button class="edit">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="delete">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;

    blogContainer.insertBefore(post, blogContainer.firstChild);
    blogCount++;
    updateCounter();

    // Remove empty state if present
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Edit functionality
    post.querySelector('.edit').addEventListener('click', () => {
      titleInput.value = title;
      contentInput.value = content;
      editMode = true;
      currentEditPost = { id: postId, title, content };
      publishBtn.innerHTML = '<i class="fas fa-save"></i> Update Post';
      document.querySelector('.popup-header h2').textContent = 'Edit Post';
      popup.classList.add('active');
      titleInput.focus();
    });

    // Delete functionality
    post.querySelector('.delete').addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this post?')) {
        try {
          // Call your delete API if needed
          // await fetch(`/delete-post/${postId}`, { method: 'DELETE' });
          
          post.remove();
          blogCount--;
          updateCounter();
          showToast('Post deleted successfully!', 'success');
          
          if (blogCount === 0) {
            showEmptyState();
          }
        } catch (err) {
          console.error('Delete error:', err);
          showToast('Failed to delete post', 'error');
        }
      }
    });
  }

  // Delete all blogs
  deleteAllBtn.addEventListener('click', async () => {
    if (blogCount === 0) {
      showToast('No posts to delete!', 'info');
      return;
    }

    if (confirm('Are you sure you want to delete ALL blog posts?')) {
      try {
        const res = await fetch('/delete-all', { method: 'DELETE' });
        const data = await res.json();
        
        if (res.ok) {
          blogContainer.innerHTML = '';
          blogCount = 0;
          updateCounter();
          showEmptyState();
          showToast('All posts deleted!', 'success');
        } else {
          showToast(data.message || 'Failed to delete all', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Server error', 'error');
      }
    }
  });

  // Update blog counter display
  function updateCounter() {
    counter.textContent = `Total Blogs: ${blogCount}`;
  }

  // Toggle nav menu (mobile)
  hamburger.addEventListener('click', () => {
    navButtons.classList.toggle('show');
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        !hamburger.contains(e.target) && 
        !navButtons.contains(e.target) && 
        navButtons.classList.contains('show')) {
      navButtons.classList.remove('show');
    }
  });

  // Helper functions
  function resetForm() {
    titleInput.value = '';
    contentInput.value = '';
    editMode = false;
    currentEditPost = null;
    publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Post';
    document.querySelector('.popup-header h2').textContent = 'Create New Post';
    publishBtn.disabled = false;
  }

  function showEmptyState() {
    blogContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-blog"></i>
        <h3>No Blog Posts Yet</h3>
        <p>Click "Create Post" to write your first blog post!</p>
      </div>
    `;
  }

  function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
      <p>${message}</p>
    `;

    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 400);
    }, 3000);
  }

  // Mock update function (replace with your actual API call)
  async function updatePostInBackend(id, title, content) {
    // Replace this with your actual update API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Updating post ${id}: ${title}`);
        resolve();
      }, 500);
    });
  }
});