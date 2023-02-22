import GUI from 'lil-gui';

export function myPanel() {

    let obj = {
        myBoolean: false,
        myString: 'lil-gui',
        myNumber: 0.5,
        label: function() { 
            window.dispatchEvent(new Event("label_webgl"));
            //alert( 'hi' )
         }
    }
    
    const gui = new GUI({ container: document.getElementById( 'panel_gui' ) });

    const controller = gui.add( obj, 'myBoolean' ); 	// checkbox
    gui.add( obj, 'myString' ); 	// text field
    gui.add( obj, 'myNumber',0, 1, 0.1 ); 	// number field
    gui.add( obj, 'label' ); 	// button

    controller.onChange( function( v ) {
        window.dispatchEvent(new Event("label_webgl"));
        //console.log( 'The value is now ' + v );
        //console.log("this",this);
        console.assert( this === controller );
    } );
}