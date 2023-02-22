import GUI from 'lil-gui';

export function myPanel() {

    let obj = {
        myBoolean: true,
        myString: 'lil-gui',
        myNumber: 1,
        myFunction: function() { alert( 'hi' ) }
    }
    
    const gui = new GUI({ container: document.getElementById( 'panel_gui' ) });

    gui.add( obj, 'myBoolean' ); 	// checkbox
    gui.add( obj, 'myString' ); 	// text field
    gui.add( obj, 'myNumber' ); 	// number field
    gui.add( obj, 'myFunction' ); 	// button
}