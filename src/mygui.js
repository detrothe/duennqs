import GUI from 'lil-gui';

let scale_factor = 1.0;
let scale_factor_arrows = 1.0;


//--------------------------------------------------------------------------------------------------------
export function myPanel() {
    //--------------------------------------------------------------------------------------------------------

    let obj = {
        label: false,
        tau: false,
        sigma: false,
        sigmaV: false,
        woelb_M: false,
        woelb_V: false,
        scale: 1.0,
        show_sides: true,
        show_arrows: true,
        scale_arrows: 1.0,
        show_sigma_frame: true,
        show_LR: false,
        Reset: function () {
            window.dispatchEvent(new Event("reset_webgl"));
        }
    }

    const gui = new GUI({ container: document.getElementById('panel_gui'), width: 230 }); // , touchStyles: true
    //gui.domElement.classList.add('allow-touch-styles');

    gui.add(obj, 'label').onChange(v => {
        window.dispatchEvent(new Event("label_webgl"));
    });

    gui.add(obj, 'tau').name('Schubspannung').onChange(v => {
        window.dispatchEvent(new Event("tau_webgl"));
    });

    gui.add(obj, 'sigma').name('Normalspannung').onChange(v => {
        window.dispatchEvent(new Event("sigma_webgl"));
    });

    gui.add(obj, 'sigmaV').name('Vergleichsspannung').onChange(v => {
        window.dispatchEvent(new Event("sigmaV_webgl"));
    });

    gui.add(obj, 'woelb_M').name('omega').onChange(v => {
        window.dispatchEvent(new Event("woelb_M_webgl"));
    });

    gui.add(obj, 'woelb_V').name('Verformung u').onChange(v => {
        window.dispatchEvent(new Event("woelb_V_webgl"));
    });

    gui.add(obj, 'scale', 0, 2, 0.1).name('Skalierung').onFinishChange(v => {
        console.log("skalierung", v)
        scale_factor = v;
        window.dispatchEvent(new Event("scale_factor"));
    });

    gui.add(obj, 'show_sides').name('Seiten anzeigen').onChange(v => {
        window.dispatchEvent(new Event("show_sides_webgl"));
    });

    gui.add(obj, 'show_arrows').name('Pfeile anzeigen').onChange(v => {
        window.dispatchEvent(new Event("show_arrows_webgl"));
    });

    gui.add(obj, 'scale_arrows', 0, 2, 0.1).name('Skalierung Pfeile').onFinishChange(v => {
        console.log("skalierung Pfeile", v)
        scale_factor_arrows = v;
        window.dispatchEvent(new Event("scale_factor_arrows"));
    });

    gui.add(obj, 'show_sigma_frame').name('sigma Fläche').onChange(v => {
        window.dispatchEvent(new Event("show_sigma_frame_webgl"));
    });

    gui.add(obj, 'show_LR').name('rechts/links anzeigen').onChange(v => {
        window.dispatchEvent(new Event("show_LR_webgl"));
    });
    gui.add(obj, 'Reset')

    gui.close();

}

//--------------------------------------------------------------------------------------------------------
export function get_scale_factor() {
    //--------------------------------------------------------------------------------------------------------
    return scale_factor;

}

//--------------------------------------------------------------------------------------------------------
export function get_scale_factor_arrows() {
    //--------------------------------------------------------------------------------------------------------
    return scale_factor_arrows;

}