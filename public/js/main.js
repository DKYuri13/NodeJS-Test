const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

const startWork = document.querySelector('.startWork.modal');
const startWorkBtn = document.querySelector('#startWorkBtn');

const stopWork = document.querySelector('.stopWork.modal');
const stopWorkBtn = document.querySelector('#stopWorkBtn');

const annualLeave = document.querySelector('.annualLeave.modal');
const annualLeaveBtn = document.querySelector('#annualLeaveBtn');

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


startWorkBtn.addEventListener('click', startWorkBtnClickHandler);
stopWorkBtn.addEventListener('click', stopWorkBtnClickHandler);
annualLeaveBtn.addEventListener('click', annualLeaveBtnClickHandler);
backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

