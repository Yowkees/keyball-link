// 旧URLへのアクセスを新URL（独自ドメイン）へ転送する（パスやクエリも引き継ぐ）
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(
      `https://keyball-link.shiroganelab.com${url.pathname}${url.search}`,
      301,
    );
  },
};
