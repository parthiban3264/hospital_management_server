// File: GenericDemo.java

// A simple generic class with one type parameter T
class Box<T> {
    private T value;

    // Constructor
    public Box(T value) {
        this.value = value;
    }

    // Getter
    public T getValue() {
        return value;
    }

    // Setter
    public void setValue(T value) {
        this.value = value;
    }

    // Display the type
    public void showType() {
        System.out.println("Type of T is: " + value.getClass().getName());
    }
}

public class GenericDemo {
    public static void main(String[] args) {
        // Create a Box for Integer
        Box<Integer> intBox = new Box<>(100);
        intBox.showType();
        System.out.println("Value in intBox: " + intBox.getValue());

        // Create a Box for String
        Box<String> strBox = new Box<>("Hello Generics");
        strBox.showType();
        System.out.println("Value in strBox: " + strBox.getValue());
    }
}
