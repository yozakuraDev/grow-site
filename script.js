/* ========================================================================
   一般社団法人 Grow福祉協会 公式サイト スクリプト
   構成：
   1. ヘッダー固定時のスタイル切り替え
   2. ハンバーガーメニュー
   3. スムーズスクロール
   4. スクロール連動フェードインアニメーション
   5. ページトップボタン
   6. お知らせスライダー（自動切替）
   7. 事業紹介：カテゴリフィルター
   8. よくある質問：アコーディオン
   9. お問い合わせフォームのバリデーション
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initHamburgerMenu();
  initSmoothScroll();
  initScrollReveal();
  initToTopButton();
  initNewsSlider();
  initServiceFilter();
  initFaqAccordion();
  initContactForm();
});

/* ------------------------------------------------------------------------
   1. ヘッダー固定時のスタイル切り替え
   スクロールするとヘッダーの高さと影を変化させ、視認性を保つ。
------------------------------------------------------------------------ */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const updateHeader = () => {
    if (window.scrollY > 12) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

/* ------------------------------------------------------------------------
   2. ハンバーガーメニュー
   モバイル幅でナビゲーションを開閉する。アクセシビリティのため
   aria-expanded を切り替え、背景オーバーレイでフォーカスを誘導する。
------------------------------------------------------------------------ */
function initHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".global-nav");
  const overlay = document.querySelector(".nav-overlay");
  if (!hamburger || !nav) return;

  const closeMenu = () => {
    hamburger.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  const openMenu = () => {
    hamburger.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    overlay?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  hamburger.addEventListener("click", () => {
    const isOpen = hamburger.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  overlay?.addEventListener("click", closeMenu);

  // メニュー内のリンクをクリックしたら閉じる
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // ESCキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // 画面幅が広がった場合はメニュー状態をリセット
  window.addEventListener("resize", () => {
    if (window.innerWidth > 780) closeMenu();
  });
}

/* ------------------------------------------------------------------------
   3. スムーズスクロール
   ページ内アンカーリンク（#から始まるhref）をクリックした際、
   ヘッダーの高さ分オフセットして滑らかにスクロールする。
------------------------------------------------------------------------ */
function initSmoothScroll() {
  const header = document.querySelector(".site-header");
  const headerHeight = header ? header.offsetHeight : 0;

  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const url = new URL(link.href, window.location.href);
      const isSamePage = url.pathname === window.location.pathname;
      const hash = url.hash;

      if (!isSamePage || !hash) return;

      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

/* ------------------------------------------------------------------------
   4. スクロール連動フェードインアニメーション
   IntersectionObserver を使い、画面内に入った要素へ
   .is-visible クラスを付与してCSSアニメーションを発火させる。
------------------------------------------------------------------------ */
function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-stagger");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------------
   5. ページトップボタン
   一定量スクロールしたら表示し、クリックでページ最上部へ戻る。
------------------------------------------------------------------------ */
function initToTopButton() {
  const button = document.querySelector(".to-top");
  if (!button) return;

  const toggleVisibility = () => {
    if (window.scrollY > 480) {
      button.classList.add("is-visible");
    } else {
      button.classList.remove("is-visible");
    }
  };

  toggleVisibility();
  window.addEventListener("scroll", toggleVisibility, { passive: true });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ------------------------------------------------------------------------
   6. お知らせスライダー（自動切替）
   トップページのお知らせをカルーセル表示し、一定間隔で自動的に
   スライドを切り替える。ドットクリックでも操作可能。
------------------------------------------------------------------------ */
function initNewsSlider() {
  const slider = document.querySelector(".news-slider");
  if (!slider) return;

  const track = slider.querySelector(".news-track");
  const slides = Array.from(slider.querySelectorAll(".news-slide"));
  const dotsWrap = slider.querySelector(".news-dots");
  if (!track || slides.length <= 1) return;

  let current = 0;
  let timerId = null;
  const intervalMs = 5000;

  // ドットを生成
  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.className = "news-dot" + (index === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", `お知らせ ${index + 1} を表示`);
    dot.addEventListener("click", () => goTo(index));
    dotsWrap?.appendChild(dot);
    return dot;
  });

  function update() {
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    update();
    restartTimer();
  }

  function next() {
    goTo(current + 1);
  }

  function restartTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(next, intervalMs);
  }

  slider.addEventListener("mouseenter", () => timerId && clearInterval(timerId));
  slider.addEventListener("mouseleave", restartTimer);

  update();
  restartTimer();
}

/* ------------------------------------------------------------------------
   7. 事業紹介：カテゴリフィルター
   「開設中」「構想中」などのタブをクリックすると該当カードのみ表示する。
------------------------------------------------------------------------ */
function initServiceFilter() {
  const tabs = document.querySelectorAll(".filter-tab");
  const cards = document.querySelectorAll("[data-status]");
  if (!tabs.length || !cards.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const filter = tab.dataset.filter;

      cards.forEach((card) => {
        const show = filter === "all" || card.dataset.status === filter;
        card.style.display = show ? "" : "none";
      });
    });
  });
}

/* ------------------------------------------------------------------------
   8. よくある質問：アコーディオン
   質問をクリックすると回答の開閉を切り替える。
------------------------------------------------------------------------ */
function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const question = item.querySelector(".faq-question");
    question?.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      question.setAttribute("aria-expanded", String(!isOpen));
      item.classList.toggle("is-open");
    });
  });
}

/* ------------------------------------------------------------------------
   9. お問い合わせフォームのバリデーション
   必須入力チェック・メール形式チェックを行い、エラー時は該当項目に
   メッセージを表示、正常時は送信完了メッセージを表示する。
   ※実際のサーバー送信は行わず、フロントエンドの動作確認用。
------------------------------------------------------------------------ */
function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const statusBox = document.querySelector("#form-status");
  const statusText = statusBox?.querySelector("span");

  // メールアドレスの簡易正規表現（一般的な形式をチェック）
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // 電話番号（ハイフンあり・なし、10〜11桁程度を許容）
  const phonePattern = /^[0-9()\-‐ー\s]{9,15}$/;

  const fieldRules = {
    name: {
      validate: (value) => value.trim().length > 0,
      message: "お名前を入力してください。",
    },
    kana: {
      validate: (value) => value.trim().length > 0,
      message: "フリガナを入力してください。",
    },
    email: {
      validate: (value) => value.trim().length > 0 && emailPattern.test(value.trim()),
      message: "正しいメールアドレスの形式で入力してください。",
    },
    tel: {
      validate: (value) => value.trim().length === 0 || phonePattern.test(value.trim()),
      message: "正しい電話番号の形式で入力してください。",
    },
    category: {
      validate: (value) => value.trim().length > 0,
      message: "お問い合わせ種別を選択してください。",
    },
    message: {
      validate: (value) => value.trim().length > 0,
      message: "お問い合わせ内容を入力してください。",
    },
  };

  function showError(field, message) {
    const group = field.closest(".form-group");
    if (!group) return;
    group.classList.add("has-error");
    const errorEl = group.querySelector(".error-message");
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(field) {
    const group = field.closest(".form-group");
    if (!group) return;
    group.classList.remove("has-error");
  }

  function validateField(field) {
    const rule = fieldRules[field.name];
    if (!rule) return true;
    const valid = rule.validate(field.value);
    valid ? clearError(field) : showError(field, rule.message);
    return valid;
  }

  // リアルタイムバリデーション（入力・変更のたびにチェック）
  Object.keys(fieldRules).forEach((name) => {
    const field = form.elements.namedItem(name);
    if (!field) return;
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".form-group")?.classList.contains("has-error")) {
        validateField(field);
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isFormValid = true;
    Object.keys(fieldRules).forEach((name) => {
      const field = form.elements.namedItem(name);
      if (!field) return;
      const valid = validateField(field);
      if (!valid) isFormValid = false;
    });

    if (!statusBox) return;

    if (!isFormValid) {
      if (statusText) statusText.textContent = "入力内容に誤りがあります。赤色で示された項目をご確認ください。";
      statusBox.classList.remove("is-success");
      statusBox.classList.add("is-error");
      statusBox.style.display = "flex";
      // 最初のエラー項目までスクロール
      const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
      firstError?.focus();
      return;
    }

    // 実際の送信処理はバックエンド実装時に置き換える想定
    if (statusText) statusText.textContent = "お問い合わせを受け付けました。担当者より2〜3営業日以内にご連絡いたします。";
    statusBox.classList.remove("is-error");
    statusBox.classList.add("is-success");
    statusBox.style.display = "flex";
    form.reset();
    statusBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
