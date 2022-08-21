const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');
const startWork = document.querySelector('.startWork.modal');
const stopWork = document.querySelector('.stopWork.modal');
const annualLeave = document.querySelector('.annualLeave.modal');
const startWorkBtn = document.querySelector('#startWorkBtn');
const stopWorkBtn = document.querySelector('#stopWorkBtn');
const annualLeaveBtn = document.querySelector('#annualLeaveBtn');
const editImageBtn = document.querySelector('#editImage');
const editImage_modal = document.querySelector('#editImage_modal');
const imageUrlBtn = document.querySelector('#imageUrl');

function editImageBtnClickHandler() {
  editImage_modal.style.display = 'block';
}

function imageUrlBtnClickHandler() {
  editImage_modal.style.display = 'none';
}

function startWorkBtnClickHandler() {
  startWork.style.display = 'block';
  stopWork.style.display = 'none';
  annualLeave.style.display = 'none';
}

function stopWorkBtnClickHandler() {
  stopWork.style.display = 'block';
  startWork.style.display = 'none';
  annualLeave.style.display = 'none';
}

function annualLeaveBtnClickHandler() {
  annualLeave.style.display = 'block';
  stopWork.style.display = 'none';
  startWork.style.display = 'none';
}

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

imageUrlBtn.addEventListener('click', imageUrlBtnClickHandler);
editImageBtn.addEventListener('click', editImageBtnClickHandler);
startWorkBtn.addEventListener('click', startWorkBtnClickHandler);
stopWorkBtn.addEventListener('click', stopWorkBtnClickHandler);
annualLeaveBtn.addEventListener('click', annualLeaveBtnClickHandler);
backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);
