function move(event) {
  let key = event.keyCode,
    chrId = document.getElementById('test'),
    chr = {
      updown: function () {
        // getComputedStyle from chrId(#test).top
        let y = parseInt(getComputedStyle(chrId).top);
        // If the Key is Up, then Decrement top. If the Key is Down, then Increment top.
        if (key == 38 || key == 87) {
          --y;
        } else if (key == 40 || key == 83) {
          ++y;
        }
        // return the computed.
        return y;
      },

      leftright: function () {
        let x = parseInt(getComputedStyle(chrId).left);
        if (key == 37 || key == 65) {
          --x;
        } else if (key == 39 || key == 68) {
          ++x;
        }

        return x;
      }
    };

  chrId.style.top = (chr.updown()) + "px";
  chrId.style.left = (chr.leftright()) + "px";
}

document.addEventListener('keydown', move);