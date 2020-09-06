// Keyboard Function
export default function keyboard(value) {
    let code = {};
    code.value = value;
    code.isDown = false;
    code.isUp = true;
    code.press = undefined;
    code.release = undefined;
    //The `downHandler`
    code.downHandler = event => {
        if (event.code === code.value) {
            if (code.isUp && code.press) code.press();
            code.isDown = true;
            code.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    code.upHandler = event => {
        if (event.code === code.value) {
            if (code.isDown && code.release) code.release();
            code.isDown = false;
            code.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = code.downHandler.bind(code);
    const upListener = code.upHandler.bind(code);

    window.addEventListener(
        "keydown", downListener, false
    );
    window.addEventListener(
        "keyup", upListener, false
    );

    // Detach event listeners
    code.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };

    return code;
}