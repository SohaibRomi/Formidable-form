/* global jQuery, wp */
jQuery(document).ready(function ($) {
  function openMediaFrame(button, onSelect) {
    var frame = wp.media({
      title: 'Select Image',
      library: { type: 'image' },
      multiple: false
    });
    frame.on('select', function () {
      var attachment = frame.state().get('selection').first().toJSON();
      if (onSelect) onSelect(attachment);
    });
    frame.open();
  }

  $(document).on('click', '.frm_sim_upload_button', function (e) {
    e.preventDefault();
    var btn = $(this);
    var fieldId = btn.data('field-id');
    var uploadType = btn.data('upload-type'); // 'background' | 'layer'

    openMediaFrame(btn, function (attachment) {
      if (uploadType === 'background') {
        $('#background_image_' + fieldId).val(attachment.id);
        var $preview = $('#bg-preview-' + fieldId);
        if ($preview.length === 0) {
          $preview = $('<img/>', { id: 'bg-preview-' + fieldId, style: 'max-width:200px; display:block; margin-bottom:10px;' });
          btn.before($preview);
        }
        $preview.attr('src', attachment.url);
      } else {
        $('#layer_image_' + fieldId).val(attachment.id);
        var $preview2 = $('#layer-preview-' + fieldId);
        if ($preview2.length === 0) {
          $preview2 = $('<img/>', { id: 'layer-preview-' + fieldId, style: 'max-width:200px; display:block; margin-bottom:10px;' });
          btn.before($preview2);
        }
        $preview2.attr('src', attachment.url);
      }
    });
  });
});
