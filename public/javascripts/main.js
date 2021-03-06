$(document).ready(function () {

	$('.questions-image').slick({
		infinite: false,
		slidesToShow: 5,
		slidesToScroll: 1,

		responsive: [
			{
				breakpoint: 700,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					infinite: true,

				}
			}
		]

	});


	$('.discover-trend-bottom').slick({
		infinite: false,
		slidesToShow: 4,
		slidesToScroll: 1,
		variableWidth: true,
		responsive: [
			{
				breakpoint: 1300,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
					infinite: true,
				}
			}
			,

			{
				breakpoint: 800,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					infinite: true,
				}
			}
		]

	});


	$('.discover-quizs-bottom').slick({
		infinite: true,
		slidesToShow: 4,
		slidesToScroll: 1,

		responsive: [
			{
				breakpoint: 1300,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 1,
					infinite: true,
				}
			}
			,

			{
				breakpoint: 800,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					infinite: true,
				}
			}
		]

	});
	$(".mobil-profil").click(function (e) {
		e.preventDefault();
		$(".content-profil").addClass("open");
	});

	$(".profil-close").click(function (e) {
		e.preventDefault();
		$(".content-profil").removeClass("open");
	});
});
function readQuizImageURL(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = function (e) {
			$('#QuizImage').attr('src', e.target.result);
		};

		reader.readAsDataURL(input.files[0]);
	}
}
function readQuestionImageURL(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = function (e) {
			$('#QuestionImage').attr('src', e.target.result);
		};

		reader.readAsDataURL(input.files[0]);
	}
}
function readProfileImageURL(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = function (e) {
			$('#ProfileImage').attr('src', e.target.result);
		};

		reader.readAsDataURL(input.files[0]);
	}
}