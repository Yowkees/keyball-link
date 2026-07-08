// 旧URLへのアクセスを新URLへ転送する（パスやクエリも引き継ぐ）
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(
      `https://keyball-link.yoho-3418.workers.dev${url.pathname}${url.search}`,
      301,
    );
  },
};
