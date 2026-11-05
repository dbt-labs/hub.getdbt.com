// This is where it all goes :)

// Copy-to-clipboard button for the install snippet on package pages
var COPY_ICON = '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.75" y="0.75" width="9.5" height="9.5" rx="1.5"/><path d="M3.5 5.25h-1.25a1.5 1.5 0 0 0-1.5 1.5v6.5a1.5 1.5 0 0 0 1.5 1.5h6.5a1.5 1.5 0 0 0 1.5-1.5v-1.25"/></svg>';
var CHECK_ICON = '<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>';

function addCopyButton(pre) {
  if (!pre || !navigator.clipboard) return;

  // Wrap the pre so the button stays put when the code scrolls horizontally
  var wrapper = document.createElement('div');
  wrapper.className = 'code-block';
  pre.parentNode.insertBefore(wrapper, pre);
  wrapper.appendChild(pre);

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-code-button';
  wrapper.appendChild(button);

  function setState(copied) {
    button.innerHTML = copied ? CHECK_ICON : COPY_ICON;
    button.classList.toggle('copied', copied);
    button.setAttribute('data-tooltip', copied ? 'Copied' : 'Copy code');
    button.setAttribute('aria-label', copied ? 'Copied' : 'Copy code');
  }
  setState(false);

  button.addEventListener('click', function() {
    navigator.clipboard.writeText(pre.innerText.replace(/\n$/, '')).then(function() {
      setState(true);
    }).catch(function() {
      button.setAttribute('data-tooltip', 'Copy failed');
      button.setAttribute('aria-label', 'Copy failed');
    });
  });

  // Reset once the pointer or focus leaves, so the next hover says "Copy code" again
  button.addEventListener('mouseleave', function() { setState(false); });
  button.addEventListener('blur', function() { setState(false); });
}

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
