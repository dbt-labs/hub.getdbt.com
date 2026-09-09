// This is where it all goes :)
// Package search and filter functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('package-search');
  const v2Filter = document.getElementById('v2-filter');
  const noResultsMessage = document.getElementById('no-results');
  const clearButton = document.getElementById('clear-search');
  
  if (!searchInput || !v2Filter) return;
  
  // Cache DOM queries on page load (these don't change without a full refresh)
  const allOrgs = document.querySelectorAll('.package-org');
  const orgData = Array.from(allOrgs).map(function(orgDiv) {
    const packages = Array.from(orgDiv.querySelectorAll('.package-item')).map(function(li) {
      return {
        element: li,
        packageName: li.getAttribute('data-package-name'),
        fullName: li.getAttribute('data-full-name'),
        isV2: li.getAttribute('data-v2-compatible') === 'true'
      };
    });
    return { element: orgDiv, packages: packages };
  });
  
  function debounce(func, wait) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }
  
  function updateClearButton() {
    if (clearButton) {
      clearButton.classList.toggle('hidden', !searchInput.value);
    }
  }
  
  function filterPackages() {
    // Use requestAnimationFrame to batch DOM updates into a single repaint
    requestAnimationFrame(function() {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const showOnlyV2 = v2Filter.checked;
      let visibleCount = 0;
      
      orgData.forEach(function(org) {
        let orgHasVisiblePackages = false;
        
        org.packages.forEach(function(pkg) {
          // Check if package matches search term
          const matchesSearch = !searchTerm || 
                               pkg.packageName.includes(searchTerm) || 
                               pkg.fullName.includes(searchTerm);
          
          // Check if package matches v2 filter
          const matchesV2 = !showOnlyV2 || pkg.isV2;
          
          // Show or hide package using CSS class (more performant than inline styles)
          if (matchesSearch && matchesV2) {
            pkg.element.classList.remove('hidden');
            orgHasVisiblePackages = true;
            visibleCount++;
          } else {
            pkg.element.classList.add('hidden');
          }
        });
        
        // Show or hide entire org section
        org.element.classList.toggle('hidden', !orgHasVisiblePackages);
      });
      
      // Show "no results" message if nothing matches
      noResultsMessage.classList.toggle('hidden', visibleCount > 0);
    });
  }
  
  const debouncedFilter = debounce(filterPackages, 200);
  
  searchInput.addEventListener('input', function() {
    updateClearButton();
    debouncedFilter();
  });
  v2Filter.addEventListener('change', filterPackages);
  
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
    if (v2Filter.checked || searchInput.value) {
      filterPackages();
    }
  }, 100);

  // Position fixed popovers above their parent element
  document.querySelectorAll('.has-popover').forEach(function(el) {
    var popover = el.querySelector('.popover-text');
    if (!popover) return;

    function positionPopover() {
      var rect = el.getBoundingClientRect();
      popover.style.left = rect.left + 'px';
      popover.style.top = (rect.top - popover.offsetHeight - 6) + 'px';
    }

    el.addEventListener('mouseenter', positionPopover);
    el.addEventListener('focus', positionPopover);
  });
});
