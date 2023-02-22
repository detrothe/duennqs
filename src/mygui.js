import GUI from 'lil-gui';

let scale_factor = 1.0;

//--------------------------------------------------------------------------------------------------------
export function myPanel() {
    //--------------------------------------------------------------------------------------------------------

    let obj = {
        label: false,
        tau: false,
        sigma: false,
        woelb_M: false,
        woelb_V: false,
        scale: 1.0,
        Reset: function () {
            window.dispatchEvent(new Event("reset_webgl"));
        }
    }

    const gui = new GUI({ container: document.getElementById('panel_gui') });

    gui.add(obj, 'label').onChange(v => {
        window.dispatchEvent(new Event("label_webgl"));
    }); 	

    gui.add(obj, 'tau').name('Schubspannung').onChange(v => {
        window.dispatchEvent(new Event("tau_webgl"));
    });

    gui.add(obj, 'sigma').name('Normalspannung').onChange(v => {
        window.dispatchEvent(new Event("sigma_webgl"));
    });

    gui.add(obj, 'woelb_M').name('Verwölbung').onChange(v => {
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

    gui.add(obj, 'Reset')

}

//--------------------------------------------------------------------------------------------------------
export function get_scale_factor() {
    //--------------------------------------------------------------------------------------------------------
    return scale_factor;

}