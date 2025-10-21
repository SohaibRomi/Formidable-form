/* global jQuery, console */
jQuery(document).ready(function ($) {
  function moveLayersIntoCanvases(scope) {
    var root = scope || $(document);
    root.find('img.simulator-layer-img').each(function () {
      var img = $(this);
      // Find field container and the parent section heading (canvas container)
      var container = img.closest('.frm_form_field');
      var section = container.closest('.frm_form_field.frm_section_heading');
      var canvas = section.find('.simulator-canvas').first();
      if (canvas.length === 0) {
        console.warn('Formidable Simulator: No canvas found for layer.', img.get(0));
        return;
      }
      // Style layer image for absolute overlay inside canvas
      img.css({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      });
      // Append into canvas and hide original field container
      canvas.append(img);
      container.css('display', 'none');
    });
  }

  function bindRadioControls(scope) {
    var root = scope || $(document);
    root.find('img.simulator-layer-img').each(function () {
      var layer = $(this);
      var controlFieldId = (layer.data('control-field-id') || '').toString().trim();
      var controlValue = (layer.data('control-value') || '').toString();
      if (!controlFieldId) {
        // No control configured; ensure layer is visible
        layer.show();
        return;
      }
      var form = layer.closest('form');
      // Try multiple selector strategies to find the radio inputs for this field id
      var radios = form.find('input[type="radio"][name*="[' + controlFieldId + ']"]');
      if (radios.length === 0) {
        radios = form.find('input[type="radio"][data-frmfieldid="' + controlFieldId + '"]');
      }
      if (radios.length === 0) {
        radios = form.find('input[type="radio"][data-fieldid="' + controlFieldId + '"]');
      }

      function evaluate() {
        var current = radios.filter(':checked').val();
        var shouldShow = controlValue === '' ? !!current : (current !== undefined && current == controlValue);
        layer.toggle(!!shouldShow);
      }

      evaluate();
      radios.on('change', evaluate);
    });
  }

  function mergeCanvasesOnSubmit() {
    $(document).on('click', '.frm_button_submit', function (e) {
      var btn = $(this);
      var form = btn.closest('form');
      var canvases = form.find('.simulator-canvas');
      if (canvases.length === 0) {
        return; // allow default submit
      }
      e.preventDefault();

      var total = canvases.length;
      var processed = 0;

      function done() {
        processed += 1;
        if (processed >= total) {
          form.get(0).submit();
        }
      }

      canvases.each(function () {
        var canvasDiv = $(this);
        var canvasId = canvasDiv.attr('id');
        // Measure rendered size
        var rect = canvasDiv.get(0).getBoundingClientRect();
        var w = Math.max(1, Math.round(rect.width));
        var h = Math.max(1, Math.round(rect.height));

        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        var ctx = c.getContext('2d');

        var bgImgEl = canvasDiv.find('img.simulator-bg').get(0) || canvasDiv.find('img').get(0);
        var layerImgs = canvasDiv.find('img.simulator-layer-img:visible');

        function drawLayersSequentially(index) {
          if (index >= layerImgs.length) {
            finalize();
            return;
          }
          var layerImg = layerImgs.get(index);
          if (layerImg.complete && layerImg.naturalWidth > 0) {
            try { ctx.drawImage(layerImg, 0, 0, w, h); } catch (err) { /* ignore */ }
            drawLayersSequentially(index + 1);
          } else {
            layerImg.onload = function () {
              try { ctx.drawImage(layerImg, 0, 0, w, h); } catch (err) { /* ignore */ }
              drawLayersSequentially(index + 1);
            };
            layerImg.onerror = function () {
              drawLayersSequentially(index + 1);
            };
          }
        }

        function drawBackgroundThenLayers() {
          if (!bgImgEl) {
            drawLayersSequentially(0);
            return;
          }
          if (bgImgEl.complete && bgImgEl.naturalWidth > 0) {
            try { ctx.drawImage(bgImgEl, 0, 0, w, h); } catch (err) { /* ignore */ }
            drawLayersSequentially(0);
          } else {
            bgImgEl.onload = function () {
              try { ctx.drawImage(bgImgEl, 0, 0, w, h); } catch (err) { /* ignore */ }
              drawLayersSequentially(0);
            };
            bgImgEl.onerror = function () {
              drawLayersSequentially(0);
            };
          }
        }

        function finalize() {
          try {
            var base64 = c.toDataURL('image/png');
            $('#merged_' + canvasId).val(base64);
          } catch (err) {
            console.warn('Formidable Simulator: Failed to export canvas (CORS likely).', err);
          }
          done();
        }

        drawBackgroundThenLayers();
      });
    });
  }

  // Initialize
  moveLayersIntoCanvases();
  bindRadioControls();
  mergeCanvasesOnSubmit();
});
