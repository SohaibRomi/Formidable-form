// js/simulator.js
jQuery(document).ready(function($) {
    // Move layers into canvas and sync visibility
    $('.frm_form_field').has('img.simulator-layer-img').each(function() {
        var container = $(this);
        var img = container.find('img.simulator-layer-img');
        if (img.length === 0) {
            console.warn('Formidable Simulator: No layer image found in container', container);
            return;
        }
        // Find the canvas in the parent section container
        var parent_section = container.closest('.frm_form_field.frm_section_heading');
        var canvas = parent_section.find('.simulator-canvas');
        if (canvas.length === 0) {
            console.warn('Formidable Simulator: No canvas found for layer in parent section', img);
            return;
        }
        img.css({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        });
        canvas.append(img);
        // Hide the layer container to remove extra space
        container.css('display', 'none');
        // Sync visibility with container
        var observer = new MutationObserver(function() {
            img.css('display', container.is(':visible') ? 'block' : 'none');
        });
        observer.observe(container[0], { attributes: true, attributeFilter: ['style', 'class'] });
        img.css('display', container.is(':visible') ? 'block' : 'none');
        console.log('Formidable Simulator: Layer moved to canvas', img.attr('src'));
    });

    // Merge on submit
    $('.frm_button_submit').on('click', function(e) {
        e.preventDefault();
        var form = $(this).closest('form');
        var canvases = form.find('.simulator-canvas');
        var processed = 0;
        if (canvases.length === 0) {
            form[0].submit();
            return;
        }
        canvases.each(function() {
            var canvas_div = $(this);
            var canvas_id = canvas_div.attr('id');
            var c = document.createElement('canvas');
            var w = canvas_div[0].getBoundingClientRect().width;
            var h = canvas_div[0].getBoundingClientRect().height;
            c.width = w;
            c.height = h;
            var ctx = c.getContext('2d');
            var bg_img = canvas_div.find('img').eq(0)[0];
            var drawAndProcess = function() {
                if (bg_img) {
                    ctx.drawImage(bg_img, 0, 0, w, h);
                } else {
                    console.warn('Formidable Simulator: No background image found for canvas', canvas_id);
                }
                var layers = canvas_div.find('img.simulator-layer-img:visible');
                var loaded = 0;
                if (layers.length === 0) {
                    finalize();
                    return;
                }
                layers.each(function(i, layerImg) {
                    if (layerImg.complete) {
                        ctx.drawImage(layerImg, 0, 0, w, h);
                        loaded++;
                        if (loaded === layers.length) finalize();
                    } else {
                        layerImg.onload = function() {
                            ctx.drawImage(layerImg, 0, 0, w, h);
                            loaded++;
                            if (loaded === layers.length) finalize();
                        };
                    }
                });
            };
            function finalize() {
                var base64 = c.toDataURL('image/png');
                $('#merged_' + canvas_id).val(base64);
                processed++;
                if (processed === canvases.length) {
                    form[0].submit();
                }
            }
            if (bg_img.complete) {
                drawAndProcess();
            } else {
                bg_img.onload = drawAndProcess;
            }
        });
    });
});
