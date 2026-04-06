export function createIntroController() {
  const screen = document.getElementById("loading-screen");
  const title = document.getElementById("loading-title");
  const matrix = document.getElementById("erosion-matrix");

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isSafari && screen) {
    screen.style.filter = "none";
    screen.style.WebkitFilter = "none"; // iOS Safari向け
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
    // ▼ Safariの場合：シンプルなフェードアウト
    tl.to(
      screen,
      {
        opacity: 0,
        duration: 3, // フェードアウトの時間（元の5秒は少し長く感じるかもしれないので、お好みで調整してください）
        ease: "power2.inOut",
        onComplete: () => {
          screen.style.display = "none";
        },
      },
      "-=1.5",
    );
  } else {
    tl.to(
      { offset: 3 },
      {
        offset: -3,
        duration: 5,
        ease: "expoScale(1,2,power1.inOut)",
        onUpdate: function () {
          const val = this.targets()[0].offset;
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
