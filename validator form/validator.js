function Validator(options){

    var formElement = document.querySelector(options.form);//form-1 form lớn chứa tất cả
    var selectorRules = {};//Object rule {rule's_selector: rule} vd:{'#email': [rule1,rule2]}

    //Lấy ra form-group(selector) chứa các thẻ label, input, form-message
    function getParent(inputElement, selector){
        while(inputElement.parentElement){
            if(inputElement.parentElement.matches(selector)){
                return inputElement.parentElement;
            }
            inputElement = inputElement.parentElement;
        }
    }

    function validate(inputElement,rule){
        var errorMessage;//rule.test() nếu lỗi thì trả về chuỗi thông báo lỗi
        
        var messageElement = getParent(inputElement, options.formGroupSelector).querySelector(options.messageSelector);
        var rules = selectorRules[rule.selector]; //Lấy ra các rule có cùng selector
        
        for (let i = 0; i < rules.length; i++) {
            switch (inputElement.type){
                //vói type radio hoặc checkbox thì lấy phần tử checked để check isRequired
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i].test(
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i].test(inputElement.value)
            }
            if(errorMessage) break;
        }
        //invalid
        if(errorMessage){
            messageElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        }
        //valid
        else{
            messageElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }
    
        return !errorMessage;//true-valid or false-invalid
    }

    if(formElement){
        //Submit form
        formElement.onsubmit = function(e){
            e.preventDefault();
            var isFormValid = true;
            
            //Check qua tất cả các rules
            options.rules.forEach(function(rule){
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement,rule);
                if(!isValid){
                    isFormValid = false;
                }
            })
            
            //Nếu form valid lấy dữ liệu đã nhập vào và thực hiện submit
            if(isFormValid){
                if(typeof options.onSubmit === 'function'){
                    var inputElements = formElement.querySelectorAll('[name]:not([disable])');
                    var isChecked = false;
                    var formValues = Array.from(inputElements).reduce(function(values,input){
                        switch(input.type){
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="'+input.name+'"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')){
                                    if(!isChecked){
                                        values[input.name] = '';//để khi ko có rule isRequired thì vẫn có key này vs value rỗng
                                    }
                                    return values;
                                }
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                isChecked = true;
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        return values;
                    },{})
                    options.onSubmit(formValues);
                }
            }

        }

        //Lặp qua các rule và lắng nghe sự kiện ở đó(blur, input)
        options.rules.forEach(function(rule){
            //tạo selectorRules
            if(Array.isArray(selectorRules[rule.selector])){
                selectorRules[rule.selector].push(rule);
            }else{
                selectorRules[rule.selector] = [rule];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);//Lấy all bởi vì khi checkbox hay radio sẽ có nhiều thẻ input
            Array.from(inputElements).forEach(function(inputElement){
                if(inputElement){
                    inputElement.onblur = function(){
                        validate(inputElement,rule);
                    }
    
                    inputElement.oninput = function(){
                        var messageElement = getParent(inputElement, options.formGroupSelector).querySelector(options.messageSelector);
                        messageElement.innerText = '';
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                    }
                }
            })
 
        })
    }
    

}

//Định nghĩa rules
Validator.isRequired = function(selector, message){
    return {
        selector: selector,
        test: function(value){
            return value ? undefined : message || 'Vui lòng nhập trường này';
        }
    }
}

Validator.isEmail = function(selector, message){
    return {
        selector: selector,
        test: function(value){
            var regex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            return value.match(regex) ? undefined : message || 'Bạn nhập sai email';
        }
    }
}

Validator.minLength = function(selector, min, message){
    return {
        selector: selector,
        test: function(value){
            return value.length > min ? undefined : message || `Mật khẩu tối thiểu ${min+1} kí tự`;
        }
    }
}

Validator.isConfirmed = function(selector, confirmSelector, message){
    return {
        selector: selector,
        test : function(value){
            var confirmValue = document.querySelector(confirmSelector).value;
            return value === confirmValue ? undefined : message || "Giá trị nhập lại không đúng";
        }
    }
}