/* global makeRequest */

/* Constants */

const URL_LOGIN = '/api/users/login';

/* JQuery */
const $fullname = $('#fullname');
const $password = $('#password');

const $login = $('#login');

/* Functions */

$(document).ready(() => {
  $login
    .on('click', async () => {
      const fullname = $fullname.val();
      const password = $password.val();

      if (!fullname) {
        $fullname.css({ borderColor: 'red' });
        alert('Введите Nickname');
        return false;
      }

      if (!fullname) {
        $password.css({ borderColor: 'red' });
        alert('Введите Password');
        return false;
      }

      const resultLogin = await makeRequest({
        method: 'POST',
        url: URL_LOGIN,
        body: {
          fullname,
          password,
        },
      });

      if (!resultLogin || !resultLogin.status) {
        alert(resultLogin.message || 'Couldnt makeRequest');
        return false;
      }

      location.href = '/';
    });
});
