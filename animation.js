export function createIntroController() {
  const screen = document.getElementById("loading-screen");
  const title = document.getElementById("loading-title");
  const matrix = document.getElementById("erosion-matrix");
  const canvas = document.getElementById("canvas");

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isSafari && screen) {
    screen.style.filter = "none";
    screen.style.WebkitFilter = "none";

    if (canvas) {
      canvas.style.filter = "blur(20px)";
      canvas.style.webkitFilter = "blur(20px)";
    }
  }

  const tl = gsap.timeline({ paused: true });

  tl.to(title, {
    opacity: 1,
    duration: 1.5,
    ease: "power2.out",
  })

    .add(() => {
      gsap.to(title, {
        x: "random(-1, 1)",
        y: "random(-1, 1)",
        repeat: 7,
        duration: 0.2,
      });
    })

    .to(title, {
      opacity: 0,
      filter: "blur(8px)",
      scale: 0.95,
      duration: 1,
      ease: "power2.inOut",
    });

  if (isSafari) {
    tl.to(
      screen,
      {
        opacity: 0,
        duration: 3,
        ease: "power2.inOut",
        onComplete: () => {
          screen.style.display = "none";
        },
      },
      "-=1.5",
    );

    if (canvas) {
      tl.to(
        { blur: 20 },
        {
          blur: 0,
          duration: 3.5,
          ease: "power2.out",
          onUpdate: function () {
            const b = this.targets()[0].blur;
            canvas.style.filter = `blur(${b}px)`;
            canvas.style.webkitFilter = `blur(${b}px)`;
          },
          onComplete: () => {
            canvas.style.filter = "";
            canvas.style.webkitFilter = "";
          },
        },
        "<1.2",
      );
    }
  } else {
    tl.to(
      { offset: 3 },
      {
        offset: -3,
        duration: 5,
        ease: "expoScale(1,2,power1.inOut)",
        onUpdate: function () {
          const val = this.targets()[0].offset;
          if (val <= -2.5) {
            screen.style.pointerEvents = "none";
          }
          matrix.setAttribute(
            "values",
            `
        0 0 0 0 0  
        0 0 0 0 0  
        0 0 0 0 0  
        3 0 0 0 ${val}
      `,
          );
        },
        onComplete: () => {
          screen.style.display = "none";
        },
      },
      "-=1.5",
    );
  }
  return {
    start: () => tl.play(),
  };
}
