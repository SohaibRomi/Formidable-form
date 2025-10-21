/* global jQuery, alert */
jQuery(document).ready(function ($) {
  // Add section classes to canvas fields in builder
  $('li.frm_field_box[data-type="canvas_background"]').addClass('frm_divider frm_section_heading frm_has_fields frm_collapse_section');

  // Restrict dragging in sortable lists
  $(document).on('sortreceive', '.frm_sortable_field_list', function (event, ui) {
    var field_type = ui.helper && ui.helper.attr('id') ? ui.helper.attr('id').replace('frm_', '').replace('_field', '') : '';
    var target_li = $(event.target).closest('li.frm_field_box');
    var is_canvas = target_li.data('type') === 'canvas_background';
    if (is_canvas) {
      if (field_type !== 'html' && field_type !== 'simulator_layer') {
        $(this).sortable('cancel');
        alert('Only HTML and Simulator Layer fields are allowed inside Canvas Background.');
      }
    } else if (field_type === 'simulator_layer') {
      $(this).sortable('cancel');
      alert('Simulator Layer can only be added inside a Canvas Background.');
    }
  });
});
