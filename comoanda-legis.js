(function () {
  
  /**
   * Auxiliary function that generates
   * a list of possible options for a given filter
   * given the source data
   */
  function getFilterOptions(filter, data) {
    
    var options = [];
    
    data.forEach(function (entry) {
      
      var value = entry[filter.sourceProperty];
      
      if (value) {
        value.forEach(function (v) {
          if (options.indexOf(v) === -1) {
            options.push(v);
          }
        });
      }
    });
    
    return options;
    
  }
  
  /**
   * List of filters that may be applied
   */
  var filters = [
    {
      label: 'elemento',
      name: 'elemento',
      sourceProperty: 'Elementos',
      type: String,
      sort: d3.ascending,
    },
    {
      label: 'aspecto',
      name: 'aspecto',
      sourceProperty: 'Aspectos',
      type: String,
      sort: d3.ascending,
    },
    {
      label: 'esfera de governo',
      name: 'esfera-de-governo',
      sourceProperty: 'Esfera de Governo',
      type: String,
      sort: d3.ascending,
    },
    {
      label: 'local',
      name: 'local',
      sourceProperty: 'Local',
      type: String,
      sort: d3.ascending,
    },
    {
      label: 'ano',
      name: 'ano',
      sourceProperty: 'Ano',
      type: Number,
      sort: d3.descending,
    }
  ];
  
  /**
   * Object that holds the currently applied filters
   */
  var appliedFilters = filters.reduce(function (res, filter) {
    res[filter.sourceProperty] = filter.initial || '_all';
    
    return res;
  }, {});
  
  /**
   * Applies the required filters to a set of data
   */
  function applyFilters(data) {
    
    return data.filter(function (entry) {
      
      return filters.every(function (filter) {
        
        var appliedFilterValue = appliedFilters[filter.sourceProperty];
        var entryValue         = entry[filter.sourceProperty];
        
        if (appliedFilterValue === '_all') {
          return true;
        } else {
          return entryValue.indexOf(appliedFilterValue) !== -1;
        }
      });
      
    });
    
  }
  
  var splitRegExp     = /;/;
  var trimStartRegExp = /^\s+/g;  // starting whitespaces
  var trimEndRegExp   = /\s+$/g;  // trailing whitespaces
  
  /**
   * Transforms 'ano' into a number;
   * Transforms all 'filters' fields into arrays
   * by running a split by semicolon ';'
   */
  function processData(data) {
    
    data.forEach(function (entry, index) {
      
      // process filters
      filters.forEach(function (filter) {
        var src = filter.sourceProperty;
        
        var srcValue = entry[src] || '';
        var value = srcValue.split(splitRegExp);
        
        if (value.length === 1 && value[0] === '') {
          value = [];
        }
        
        // enforce value types
        if (filter.type === Number) {
          value = value.map(function (v) {
            return parseInt(v, 10);
          });
        } else if (filter.type === String) {
          value = value.map(function (v) {
            v = v.replace(trimEndRegExp, '');
            v = v.replace(trimStartRegExp, '');
            
            return '' + v;
          })
        }
        
        entry[src] = value;
      });
      
      // assign an id to each item.
      // we'll just use its initial index
      entry._id = index;
    });
    
    return data;
  }
  
  /**
   * Auxiliary function that creates a option DOM node
   * based on option data
   */
  function _uiOptionElement(optionData) {
    var el = document.createElement('option');
    el.setAttribute('value', optionData.value);
    el.innerHTML = optionData.label;
    
    return el;
  }
  
  /**
   * Auxiliary function that creates the legislation
   * entry html string.
   * 
   * ATTENTION: does not generate the DOM Node,
   * it is meant to be used with d3#selection#html
   * method
   */
  function _uiLegisEntryInnerHTML(legisData) {
    return [
      '<div class="legis-info">',
        '<div class="legis-tipo-doc">',
          legisData['Tipo de documento'],
        '</div>',
        '<div class="legis-aspecto">',
          legisData['Aspectos'].join(', '),
        '</div>',
        '<div class="legis-elemento">',
          legisData['Elementos'].join(', '),
        '</div>',
        '<div class="legis-esfera">',
          'Esfera ' + legisData['Esfera de Governo'].join(', '),
        '</div>',
        '<div class="legis-local">',
          legisData['Local'].join(', '),
        '</div>',
        '<div class="legis-ano">',
          legisData['Ano'].join(', '),
        '</div>',
        '<div class="legis-tipo-legis">',
          legisData['Tipo de Legislação'],
        '</div>',
      '</div>',
      '<div class="legis-details">',
        '<h3>' + legisData['Descrição'] + '</h3>',
        '<p>' + legisData['Trecho da Lei'] + '</p>',
        '<a target="_blank" href="' + legisData['Link'] + '">saiba mais</a>',
      '</div>',
    ].join('');
  }
  
  /**
   * Renders controls
   */
  function _uiRenderControls(data) {
    
    var legisControls = document.querySelector('#legis-controls');
    
    filters.forEach(function (filter) {
      
      // setup dom and dom event listeners
      var controlElement = legisControls.querySelector(
        '[name="' + filter.name + '"]');
      
      controlElement.addEventListener('change', function () {
        var value = controlElement.options[controlElement.selectedIndex].value;
        
        // coerce value into the required filter type
        if (filter.type === Number) {
          value = parseInt(value, 10);
        } else if (filter.type === String) {
          value = '' + value;
        }
        
        // set the filter's value
        appliedFilters[filter.sourceProperty] = value;
        
        // render entries
        var filteredEntries = applyFilters(data);
        _uiRenderEntries(filteredEntries);
      });
      
      // generate options
      var options = getFilterOptions(filter, data);
      
      // sort options
      options.sort(filter.sort);
      
      options.forEach(function (opt) {
        var optEl = _uiOptionElement({
          value: opt,
          label: opt,
        });
        
        controlElement.appendChild(optEl);
      });
    });
  }
  
  /**
   * Renders entries into dom
   */
  function _uiRenderEntries(data) {
    
    console.log('render entries', data);
    
    var entryList = d3.select('#legis-entries');
    
    var entryItems = entryList.selectAll('li.entry')
      .data(data, function entryId(d) {
        return d._id;
      });
    
    var itemEnter = entryItems.enter()
      .append('li')
      .attr('class', 'entry')
      .html(_uiLegisEntryInnerHTML);
    
    var itemExit = entryItems.exit()
      .remove();
  }
  
  window.addEventListener('DOMContentLoaded', function () {
    
    d3.csv('data.csv', function (err, rawData) {
      if (err) {
        console.warn(err);
        return;
      }
      
      // process data before passing it to render functions
      var data = processData(rawData);
      
      _uiRenderControls(data);
      
      // render first 10...
      _uiRenderEntries(data.slice(0, 10));
    });
    
  });

})();
