jQuery(document).ready(function($) {
  // Attach layers into the correct canvas by matching section container
  function moveLayersIntoCanvas(root) {
    var $root = root ? $(root) : $(document);

    // For each layer, find nearest parent section that also contains a canvas
    $root.find('.frm_form_field img.simulator-layer-img').each(function() {
      var $img = $(this);
      // Skip already moved
      if ($img.data('moved-to-canvas')) return;

      var $layerField = $img.closest('.frm_form_field');
      var $section = $layerField.closest('.frm_form_field.frm_section_heading');
      var $canvas = $section.find('.simulator-canvas').first();

      if ($canvas.length === 0) {
        // Fallback: find any canvas before this field within the same form
        $canvas = $layerField.closest('form').find('.simulator-canvas').first();
      }
      if ($canvas.length === 0) return;

      // Absolutely position to cover canvas
      $img.css({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'none' // start hidden; radio logic will toggle
      });

      $canvas.append($img);
      $img.data('moved-to-canvas', true);

      // Hide original field container
      $layerField.css('display', 'none');
    });
  }

  function collectCanvasInfo($canvas) {
    var rect = $canvas[0].getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  }

  function drawMergedCanvas($canvas) {
    var dims = collectCanvasInfo($canvas);
    var w = dims.width, h = dims.height;
    var c = document.createElement('canvas');
    c.width = Math.max(w, 1);
    c.height = Math.max(h, 1);
    var ctx = c.getContext('2d');

    var $bg = $canvas.find('img').not('.simulator-layer-img').first();
    var layers = $canvas.find('img.simulator-layer-img:visible');

    var images = [];
    if ($bg.length) images.push($bg[0]);
    layers.each(function(_, el) { images.push(el); });

    var loaded = 0;
    function maybeFinish() {
      if (loaded === images.length) {
        var htmlId = $canvas.attr('id');
        $('#merged_' + htmlId).val(c.toDataURL('image/png'));
      }
    }

    images.forEach(function(imgEl) {
      if (imgEl.complete) {
        try { ctx.drawImage(imgEl, 0, 0, w, h); } catch (e) {}
        loaded++;
        maybeFinish();
      } else {
        imgEl.onload = function() {
          try { ctx.drawImage(imgEl, 0, 0, w, h); } catch (e) {}
          loaded++;
          maybeFinish();
        };
      }
    });

    if (images.length === 0) {
      maybeFinish();
    }
  }

  function applyRadioVisibility($form) {
    // For each layer with control info, toggle by the radio value
    var $layers = $form.find('img.simulator-layer-img');
    $layers.each(function() {
      var $layer = $(this);
      var controlFieldId = $layer.data('control-field-id');
      var valuesCsv = ($layer.attr('data-control-values') || '').trim();
      if (!controlFieldId || !valuesCsv) return; // no control configured

      var targetValues = valuesCsv
        .split(',')
        .map(function(s) { return s.trim(); })
        .filter(Boolean);

      var $fieldWrapper = $form.find('.frm_form_field[data-fid="' + controlFieldId + '"]');
      if ($fieldWrapper.length === 0) return;

      var $radios = $fieldWrapper.find('input[type="radio"]');
      function sync() {
        var selected = $radios.filter(':checked').val();
        var shouldShow = selected && targetValues.indexOf(String(selected)) !== -1;
        $layer.css('display', shouldShow ? 'block' : 'none');
      }
      $radios.on('change', sync);
      sync();
    });
  }

  // Initial placement
  moveLayersIntoCanvas(document);

  // Hook into Formidable dynamic logic (if fields show/hide) - basic observer to keep layer visibility synced
  var observer = new MutationObserver(function() {
    moveLayersIntoCanvas(document);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Merge on submit
  $(document).on('click', '.frm_button_submit', function(e) {
    var $btn = $(this);
    var $form = $btn.closest('form');

    // Ensure radios visibility logic applied before merge
    applyRadioVisibility($form);

    var $canvases = $form.find('.simulator-canvas');
    if ($canvases.length === 0) return; // allow default submit

    e.preventDefault();
    var remaining = $canvases.length;
    $canvases.each(function() {
      var $canvas = $(this);
      drawMergedCanvas($canvas);
      remaining -= 1;
      if (remaining === 0) {
        // All canvases processed
        $form[0].submit();
      }
    });
  });

  // Initialize radio visibility on load for any form
  $('form').each(function() { applyRadioVisibility($(this)); });
});
