/* eslint-disable */
// import '@babel/polyfill';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (map) {
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    document.querySelector('.form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    })
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        console.log(form);
        updateSettings(form, 'data');
    })
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = "Updating...";

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');
        document.querySelector('.btn--save-password').textContent = "Save password";

        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    })
}

// Preview image being uploaded for user profile
const filetag = document.querySelector('#photo');
const preview = document.querySelector('.form__user-photo');
const readURL = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
 
        reader.onload = (e) => {
            preview.setAttribute('src', e.target.result);
        };
 
        reader.readAsDataURL(input.files[0]);
    }
};
 
if (filetag && preview) {
    filetag.addEventListener('change', function () {
        readURL(this);
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        // Using { destructuring } because tourId has same name on both, we can just use this as shorthand
        // Also, "tourId" here comes from `data-tour-id=`${tour.id}` line in tour.pug, and tour-id is automatically coverted to camel 
        // case tourId
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    })
}