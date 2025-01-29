export default function loader(loading) {
  const contentWrapper = document.querySelector(".content-wrapper");
  const spinner = document.querySelector(".spinner");

  if (loading) {
    spinner.style.display = "block";
    contentWrapper.style.display = "none";
  } else {
    spinner.style.display = "none";
    contentWrapper.style.display = "block";
  }
}
