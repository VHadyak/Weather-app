export default function loader(isLoading) {
  const contentWrapper = document.querySelector(".content-wrapper");
  const childrenArray = Array.from(contentWrapper.children);

  const spinner = document.querySelector(".spinner");

  if (isLoading) {
    spinner.style.display = "block";
    childrenArray.forEach((child) => {
      child.style.display = "none";
    });
  } else {
    childrenArray.forEach((child) => {
      child.style.display = "flex";
    });
    spinner.style.display = "none";
  }
}
