import { define } from "../utils.ts";

export default define.page(({ Component }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Libra</title>
        <style>
          {`
          @view-transition {
            navigation: auto;
          }

          html {
            view-transition-name: root;
          }

          ::view-transition-old(root) {
            animation: slide-out-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          ::view-transition-new(root) {
            animation: slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          /* Reverse direction when navigating to root */
          html[data-navigate-to-root="true"]::view-transition-old(root) {
            animation: slide-out-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          html[data-navigate-to-root="true"]::view-transition-new(root) {
            animation: slide-in-left 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          /* Search box transition (home page) */
          ::view-transition-old(search-box) {
            animation: none;
            opacity: 0;
          }
          ::view-transition-new(search-box) {
            animation: none;
            opacity: 1;
          }

          /* Search box transition (search page) */
          ::view-transition-old(search-box-search) {
            animation: none;
            opacity: 0;
          }
          ::view-transition-new(search-box-search) {
            animation: none;
            opacity: 1;
          }

          /* Libra logo transition */
          ::view-transition-old(libra-logo) {
            animation: none;
            opacity: 0;
          }
          ::view-transition-new(libra-logo) {
            animation: none;
            opacity: 1;
          }

          @keyframes slide-out-left {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(-30px);
            }
          }
          @keyframes slide-in-right {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slide-out-right {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(30px);
            }
          }
          @keyframes slide-in-left {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
        </style>
        <script>
          {`
          // Set attribute before startViewTransition
          document.addEventListener('click', (e) => {
            const link = (e.target)?.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            const isRootLink = href === '/';
            const isNotOnRoot = window.location.pathname !== '/';

            if (isRootLink && isNotOnRoot) {
              // Use startViewTransition to ensure attribute is set before transition
              if ('startViewTransition' in document) {
                e.preventDefault();
                (document).startViewTransition(() => {
                  window.location.href = href;
                });
                document.documentElement.setAttribute('data-navigate-to-root', 'true');
              }
            }
          });
        `}
        </script>
      </head>
      <body class="bg-black text-white">
        <Component />
      </body>
    </html>
  );
});
