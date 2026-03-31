#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

struct Item {
    int value;
    int weight;

    Item(int v, int w) {
        value = v;
        weight = w;
    }
};

bool compareItems(Item a, Item b) {
    double ratioA = (double)a.value / a.weight;
    double ratioB = (double)b.value / b.weight;
    return ratioA > ratioB;
}

double fractionalKnapsack(int capacity, vector<Item>& items) {
    sort(items.begin(), items.end(), compareItems);
    double totalValue = 0.0;
    int currentWeight = 0;

    for (int i = 0; i < items.size(); i++) {
        if (currentWeight + items[i].weight <= capacity) {
            currentWeight += items[i].weight;
            totalValue += items[i].value;
        } else {
            int remainingCapacity = capacity - currentWeight;
            totalValue += items[i].value * ((double)remainingCapacity / items[i].weight);
            break; 
        }
    }
    return totalValue;
}

int knapSackZeroOne(int capacity, vector<Item>& items) {
    int n = items.size();
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 1; w <= capacity; w++) {
            if (items[i - 1].weight <= w) {
                dp[i][w] = max(items[i - 1].value + dp[i - 1][w - items[i - 1].weight], dp[i - 1][w]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][capacity];
}

int main() {
    int capacity = 50;
    vector<Item> items = {
        Item(60, 10),
        Item(100, 20),
        Item(120, 30)
    };

    int choice;
    bool running = true;

    cout << "======================================\n";
    cout << "       KNAPSACK ALGORITHM DEMO        \n";
    cout << "======================================\n";
    cout << "Knapsack Capacity: " << capacity << "\n";
    cout << "Items Available:\n";
    for (int i = 0; i < items.size(); i++) {
        cout << " - Item " << i + 1 << ": Value = " << items[i].value 
             << ", Weight = " << items[i].weight << "\n";
    }
    cout << "======================================\n";

    while (running) {
        cout << "\nChoose an algorithm to run:\n";
        cout << "1. Fractional Knapsack (Greedy Algorithm)\n";
        cout << "2. 0/1 Knapsack (Dynamic Programming)\n";
        cout << "3. Exit\n";
        cout << "Enter your choice (1-3): ";
        cin >> choice;

        switch (choice) {
            case 1: {
                vector<Item> itemsCopy = items; 
                double maxFractional = fractionalKnapsack(capacity, itemsCopy);
                cout << "\n--> Result: Maximum value (Fractional) = " << maxFractional << "\n";
                break;
            }
            case 2: {
                int maxZeroOne = knapSackZeroOne(capacity, items);
                cout << "\n--> Result: Maximum value (0/1) = " << maxZeroOne << "\n";
                break;
            }
            case 3:
                cout << "\nExiting program. Goodbye!\n";
                running = false;
                break;
            default:
                cout << "\nInvalid choice. Please enter 1, 2, or 3.\n";
                cin.clear();
                cin.ignore(10000, '\n');
                break;
        }
    }

    return 0;
}