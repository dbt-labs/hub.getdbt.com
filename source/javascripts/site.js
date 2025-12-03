// This is where it all goes :)
// Package search and filter functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('package-search');
  const fusionFilter = document.getElementById('fusion-filter');
  const noResultsMessage = document.getElementById('no-results');
  
  if (!searchInput || !fusionFilter) return;
  
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
        const isFusion = packageLi.getAttribute('data-fusion-conformant') === 'true';
        
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
  
  // Add event listeners
  searchInput.addEventListener('input', filterPackages);
  fusionFilter.addEventListener('change', filterPackages);
  
  // Add clear button functionality (optional enhancement)
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterPackages();
    }
  });
  
  // Apply filters on page load if browser restored any values
  setTimeout(function() {
    if (fusionFilter.checked || searchInput.value) {
      filterPackages();
    }
  }, 100);
});
