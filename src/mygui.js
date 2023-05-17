import GUI from 'lil-gui';
import { app } from "./index.js";

let scale_factor = 1.0;
let scale_factor_arrows = 1.0;


//--------------------------------------------------------------------------------------------------------
export function myPanel() {
    //--------------------------------------------------------------------------------------------------------

    let obj = {
        Label: false,
        tau: false,
        sigma: false,
        sigmaV: false,
        show_fyrd: false,
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
    let beschriftung = 'Beschriftung'
    let schubspannung = 'Schubspannung'
    let normalspannung = 'Normalspannung'
    let vergleichsspannung = 'Vergleichsspannung'
    let fyRd_anzeigen = 'fyRd anzeigen'
    let verformung_u = 'Verformung u'
    let skalierung = 'Skalierung'
    let seiten_anzeigen = 'Seiten anzeigen'
    let pfeile_anzeigen = 'Pfeile anzeigen'
    let skalierung_pfeile = 'Skalierung Pfeile'
    let sigma_flaeche = 'sigma Fläche'
    let rechts_links_anzeigen = 'rechts/links anzeigen'

    if (app.browserLanguage != 'de') {
        beschriftung = 'Label'
        schubspannung = 'Shear stress'
        normalspannung = 'Normal stress'
        vergleichsspannung = 'Equivalent stress'
        fyRd_anzeigen = 'display fyRd'
        verformung_u = 'displacement u'
        skalierung = 'Scaling'
        seiten_anzeigen = 'Show sides'
        pfeile_anzeigen = 'Show arrows'
        skalierung_pfeile = 'Scale arrows'
        sigma_flaeche = 'sigma area'
        rechts_links_anzeigen = 'show right/left'
    }

    const gui = new GUI({ container: document.getElementById('panel_gui'), width: 230 }); // , touchStyles: true
    //gui.domElement.classList.add('allow-touch-styles');

    gui.add(obj, 'Label').name(beschriftung).onChange(v => {
        window.dispatchEvent(new Event("label_webgl"));
    });

    gui.add(obj, 'tau').name(schubspannung).onChange(v => {
        window.dispatchEvent(new Event("tau_webgl"));
    });

    gui.add(obj, 'sigma').name(normalspannung).onChange(v => {
        window.dispatchEvent(new Event("sigma_webgl"));
    });

    gui.add(obj, 'sigmaV').name(vergleichsspannung).onChange(v => {
        window.dispatchEvent(new Event("sigmaV_webgl"));
    });

    gui.add(obj, 'show_fyrd').name(fyRd_anzeigen).onChange(v => {
        window.dispatchEvent(new Event("show_fyrd_webgl"));
    });

    gui.add(obj, 'woelb_M').name('omega').onChange(v => {
        window.dispatchEvent(new Event("woelb_M_webgl"));
    });

    gui.add(obj, 'woelb_V').name(verformung_u).onChange(v => {
        window.dispatchEvent(new Event("woelb_V_webgl"));
    });

    gui.add(obj, 'scale', 0, 2, 0.1).name(skalierung).onFinishChange(v => {
        console.log("skalierung", v)
        scale_factor = v;
        window.dispatchEvent(new Event("scale_factor"));
    });

    gui.add(obj, 'show_sides').name(seiten_anzeigen).onChange(v => {
        window.dispatchEvent(new Event("show_sides_webgl"));
    });

    gui.add(obj, 'show_arrows').name(pfeile_anzeigen).onChange(v => {
        window.dispatchEvent(new Event("show_arrows_webgl"));
    });

    gui.add(obj, 'scale_arrows', 0, 2, 0.1).name(skalierung_pfeile).onFinishChange(v => {
        //console.log("skalierung Pfeile", v)
        scale_factor_arrows = v;
        window.dispatchEvent(new Event("scale_factor_arrows"));
    });

    gui.add(obj, 'show_sigma_frame').name(sigma_flaeche).onChange(v => {
        window.dispatchEvent(new Event("show_sigma_frame_webgl"));
    });

    gui.add(obj, 'show_LR').name(rechts_links_anzeigen).onChange(v => {
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