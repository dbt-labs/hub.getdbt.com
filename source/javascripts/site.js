// This is where it all goes :)
// Package search and filter functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('package-search');
  const fusionFilter = document.getElementById('fusion-filter');
  const noResultsMessage = document.getElementById('no-results');
  const clearButton = document.getElementById('clear-search');
  
  if (!searchInput || !fusionFilter) return;
  
  function debounce(func, wait) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }
  
  function updateClearButton() {
    if (clearButton) {
      clearButton.style.display = searchInput.value ? 'block' : 'none';
    }
  }
  
  function filterPackages() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const showOnlyFusion = fusionFilter.checked;
    
    const allOrgs = document.querySelectorAll('.package-org');
    let visibleCount = 0;
    
    allOrgs.forEach(function(orgDiv) {
      const packages = orgDiv.querySelectorAll('.package-item');
      let orgHasVisiblePackages = false;
      
      packages.forEach(function(packageLi) {
        const packageName = packageLi.getAttribute('data-package-name');
        const fullName = packageLi.getAttribute('data-full-name');
        const isFusion = packageLi.getAttribute('data-fusion-compatible') === 'true';
        
        // Check if package matches search term
        const matchesSearch = !searchTerm || 
                             packageName.includes(searchTerm) || 
                             fullName.includes(searchTerm);
        
        // Check if package matches fusion filter
        const matchesFusion = !showOnlyFusion || isFusion;
        
        // Show or hide package
        if (matchesSearch && matchesFusion) {
          packageLi.style.display = '';
          orgHasVisiblePackages = true;
          visibleCount++;
        } else {
          packageLi.style.display = 'none';
        }
      });
      
      // Show or hide entire org section
      if (orgHasVisiblePackages) {
        orgDiv.style.display = '';
      } else {
        orgDiv.style.display = 'none';
      }
    });
    
    // Show "no results" message if nothing matches
    if (visibleCount === 0) {
      noResultsMessage.style.display = 'block';
    } else {
      noResultsMessage.style.display = 'none';
    }
  }
  
  const debouncedFilter = debounce(filterPackages, 200);
  
  searchInput.addEventListener('input', function() {
    updateClearButton();
    debouncedFilter();
  });
  fusionFilter.addEventListener('change', filterPackages);
  
  if (clearButton) {
    clearButton.addEventListener('click', function() {
      searchInput.value = '';
      updateClearButton();
      filterPackages();
      searchInput.focus();
    });
  }
  
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterPackages();
    }
  });
  
  setTimeout(function() {
    updateClearButton();
    if (fusionFilter.checked || searchInput.value) {
      filterPackages();
    }
  }, 100);
});
