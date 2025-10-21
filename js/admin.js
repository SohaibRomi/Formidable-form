jQuery(document).ready(function($) {
  // Media uploader for background/layer images in field settings
  var frame;
  $(document).on('click', '.frm_sim_upload_button', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var fieldId = $btn.data('field-id');
    var uploadType = $btn.data('upload-type'); // 'background' | 'layer'

    if (frame) {
      frame.open();
      return;
    }

    frame = wp.media({
      title: uploadType === 'background' ? 'Select Background Image' : 'Select Layer Image',
      button: { text: 'Use this image' },
      multiple: false
    });

    frame.on('select', function() {
      var attachment = frame.state().get('selection').first().toJSON();
      if (!attachment || !attachment.id) return;
      var hiddenId = uploadType === 'background' ? '#background_image_' + fieldId : '#layer_image_' + fieldId;
      $(hiddenId).val(attachment.id).trigger('change');
      var previewId = uploadType === 'background' ? '#bg-preview-' + fieldId : '#layer-preview-' + fieldId;
      if ($(previewId).length) {
        $(previewId).attr('src', attachment.url).show();
      } else {
        $('<img>', {
          id: previewId.replace('#',''),
          src: attachment.url,
          css: { maxWidth: '200px', display: 'block', marginBottom: '10px' }
        }).insertBefore($btn);
      }
    });

    frame.open();
  });
});
